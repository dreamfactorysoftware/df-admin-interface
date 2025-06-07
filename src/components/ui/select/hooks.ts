/**
 * Select Component Custom React Hooks
 * 
 * Comprehensive collection of React 19 hooks for select component logic including
 * single/multi-selection, autocomplete functionality, keyboard navigation, and 
 * HTTP verb bitmask transformations. Replaces Angular reactive forms patterns
 * with React Hook Form integration and modern React patterns.
 * 
 * @fileoverview Select component hooks for DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFormContext, type FieldPath, type FieldValues, type UseFormRegister } from 'react-hook-form';
import { useDebouncedValue, useDebouncedCallback } from '../../hooks/use-debounce';
import { cn } from '../../lib/utils';
import type {
  SelectValue,
  SelectOption,
  OptionGroup,
  SelectProps,
  AutocompleteProps,
  MultiSelectProps,
  AdvancedSelectProps,
  BitmaskValue,
  ValueTransform,
  SelectLoadingState,
  SelectErrorState,
} from './types';

/**
 * Hook return type for basic select functionality
 */
export interface UseSelectReturn<T = SelectValue> {
  /** Current selected value */
  selectedValue: T | undefined;
  /** Selected option object with metadata */
  selectedOption: SelectOption<T> | undefined;
  /** Handle value selection */
  handleSelect: (value: T, option?: SelectOption<T>) => void;
  /** Clear current selection */
  clearSelection: () => void;
  /** Whether component is open/focused */
  isOpen: boolean;
  /** Set open state */
  setIsOpen: (open: boolean) => void;
  /** Validation error state */
  error: string | undefined;
  /** Whether field is required */
  isRequired: boolean;
  /** Field registration for React Hook Form */
  register: any;
}

/**
 * Hook return type for autocomplete functionality
 */
export interface UseAutocompleteReturn<T = SelectValue> extends UseSelectReturn<T> {
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Debounced search query */
  debouncedSearchQuery: string;
  /** Filtered options based on search */
  filteredOptions: SelectOption<T>[];
  /** Search loading state */
  isSearching: boolean;
  /** Recent selections for quick access */
  recentSelections: SelectOption<T>[];
  /** Handle search input change */
  handleSearchChange: (query: string) => void;
  /** Create new option from search input */
  handleCreateOption: () => Promise<void>;
  /** Whether current search can create new option */
  canCreateOption: boolean;
}

/**
 * Hook return type for multi-select functionality
 */
export interface UseMultiSelectReturn<T = SelectValue> extends Omit<UseSelectReturn<T>, 'selectedValue' | 'selectedOption'> {
  /** Array of selected values */
  selectedValues: T[];
  /** Array of selected option objects */
  selectedOptions: SelectOption<T>[];
  /** Handle multiple value selection */
  handleMultiSelect: (value: T, option?: SelectOption<T>) => void;
  /** Remove specific value from selection */
  removeValue: (value: T) => void;
  /** Select all available options */
  selectAll: () => void;
  /** Clear all selections */
  clearAll: () => void;
  /** Whether all options are selected */
  isAllSelected: boolean;
  /** Number of selected items */
  selectionCount: number;
  /** Whether max selections reached */
  isMaxReached: boolean;
}

/**
 * Hook return type for option management
 */
export interface UseSelectOptionsReturn<T = SelectValue> {
  /** Normalized flat options array */
  flatOptions: SelectOption<T>[];
  /** Grouped options if grouping is enabled */
  groupedOptions: OptionGroup<T>[];
  /** Find option by value */
  findOption: (value: T) => SelectOption<T> | undefined;
  /** Get display label for value */
  getDisplayLabel: (value: T) => string;
  /** Filter options by search query */
  filterOptions: (query: string) => SelectOption<T>[];
  /** Whether options contain groups */
  hasGroups: boolean;
}

/**
 * Hook return type for keyboard navigation
 */
export interface UseSelectKeyboardReturn {
  /** Currently highlighted option index */
  highlightedIndex: number;
  /** Set highlighted index */
  setHighlightedIndex: (index: number) => void;
  /** Move highlight up */
  moveHighlightUp: () => void;
  /** Move highlight down */
  moveHighlightDown: () => void;
  /** Select highlighted option */
  selectHighlighted: () => void;
  /** Reset highlight to first option */
  resetHighlight: () => void;
  /** Keyboard event handler */
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Hook return type for validation integration
 */
export interface UseSelectValidationReturn {
  /** Current validation error */
  error: string | undefined;
  /** Whether field is valid */
  isValid: boolean;
  /** Whether field is required */
  isRequired: boolean;
  /** Validate current value */
  validate: (value: any) => string | undefined;
  /** Clear validation error */
  clearError: () => void;
  /** Field registration for forms */
  register: any;
}

/**
 * Hook for basic single selection state management and value transformation
 * 
 * @param props - Select component props
 * @returns Select state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   selectedValue,
 *   handleSelect,
 *   clearSelection,
 *   isOpen,
 *   setIsOpen
 * } = useSelect({
 *   value: selectedDb,
 *   onChange: setSelectedDb,
 *   options: databaseOptions
 * });
 * ```
 */
export function useSelect<T = SelectValue, TFieldValues extends FieldValues = FieldValues>(
  props: SelectProps<T, TFieldValues>
): UseSelectReturn<T> {
  const {
    value,
    defaultValue,
    onChange,
    options = [],
    name,
    rules,
    disabled = false,
    valueTransform,
  } = props;

  const formContext = useFormContext<TFieldValues>();
  const [internalValue, setInternalValue] = useState<T | undefined>(value ?? defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  // Get options handling
  const { flatOptions, findOption, getDisplayLabel } = useSelectOptions(options);

  // Find current selected option
  const selectedOption = useMemo(() => {
    return currentValue !== undefined ? findOption(currentValue) : undefined;
  }, [currentValue, findOption]);

  // Value transformation
  const transformValue = useCallback((rawValue: T): T => {
    if (valueTransform?.toFormValue) {
      return valueTransform.toFormValue(rawValue);
    }
    return rawValue;
  }, [valueTransform]);

  const handleSelect = useCallback((selectedValue: T, option?: SelectOption<T>) => {
    const transformedValue = transformValue(selectedValue);
    
    if (!isControlled) {
      setInternalValue(transformedValue);
    }
    
    onChange?.(transformedValue, option);
    setIsOpen(false);
    setError(undefined);
  }, [onChange, isControlled, transformValue]);

  const clearSelection = useCallback(() => {
    const clearedValue = undefined as T | undefined;
    
    if (!isControlled) {
      setInternalValue(clearedValue);
    }
    
    onChange?.(clearedValue as T);
    setError(undefined);
  }, [onChange, isControlled]);

  // Form integration
  const register = useMemo(() => {
    if (formContext && name) {
      return formContext.register(name as FieldPath<TFieldValues>, {
        ...rules,
        disabled,
        value: currentValue,
      });
    }
    return {};
  }, [formContext, name, rules, disabled, currentValue]);

  // Validation
  const isRequired = Boolean(rules?.required);

  useEffect(() => {
    if (formContext && name) {
      const fieldError = formContext.formState.errors[name as FieldPath<TFieldValues>];
      setError(fieldError?.message as string);
    }
  }, [formContext, name]);

  return {
    selectedValue: currentValue,
    selectedOption,
    handleSelect,
    clearSelection,
    isOpen,
    setIsOpen,
    error,
    isRequired,
    register,
  };
}

/**
 * Hook for autocomplete functionality with debounced search and async loading
 * 
 * @param props - Autocomplete component props
 * @returns Autocomplete state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   filteredOptions,
 *   handleCreateOption,
 *   canCreateOption
 * } = useAutocomplete({
 *   options: databaseTables,
 *   onSearch: handleTableSearch,
 *   allowCustomValue: true,
 *   searchDebounce: 300
 * });
 * ```
 */
export function useAutocomplete<T = SelectValue, TFieldValues extends FieldValues = FieldValues>(
  props: AutocompleteProps<T, TFieldValues>
): UseAutocompleteReturn<T> {
  const {
    searchQuery: controlledSearchQuery,
    searchDebounce = 300,
    minSearchLength = 2,
    onSearch,
    asyncOptions,
    allowCustomValue = false,
    onCreateOption,
    filterOptions: customFilterOptions,
    showRecentSelections = false,
    maxRecentSelections = 5,
    options = [],
  } = props;

  const baseSelect = useSelect(props);
  const [internalSearchQuery, setInternalSearchQuery] = useState(controlledSearchQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSelections, setRecentSelections] = useState<SelectOption<T>[]>([]);
  const isSearchControlled = controlledSearchQuery !== undefined;

  const currentSearchQuery = isSearchControlled ? controlledSearchQuery : internalSearchQuery;

  // Debounced search query for API calls
  const { debouncedValue: debouncedSearchQuery, isPending } = useDebouncedValue(
    currentSearchQuery,
    { delay: searchDebounce }
  );

  // Get options handling
  const { flatOptions, filterOptions: defaultFilterOptions } = useSelectOptions(options);

  // Handle search input changes
  const handleSearchChange = useCallback((query: string) => {
    if (!isSearchControlled) {
      setInternalSearchQuery(query);
    }
  }, [isSearchControlled]);

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback(
    async (query: string) => {
      if (query.length >= minSearchLength) {
        setIsSearching(true);
        try {
          if (asyncOptions) {
            await asyncOptions(query);
          } else if (onSearch) {
            await onSearch(query);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setIsSearching(false);
      }
    },
    { delay: searchDebounce, trailing: true }
  );

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== currentSearchQuery) {
      debouncedSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, currentSearchQuery, debouncedSearch]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!currentSearchQuery) {
      return showRecentSelections ? recentSelections : flatOptions;
    }

    if (currentSearchQuery.length < minSearchLength) {
      return [];
    }

    const filterFn = customFilterOptions || defaultFilterOptions;
    return filterFn(currentSearchQuery);
  }, [
    currentSearchQuery,
    minSearchLength,
    flatOptions,
    showRecentSelections,
    recentSelections,
    customFilterOptions,
    defaultFilterOptions,
  ]);

  // Check if current search can create new option
  const canCreateOption = useMemo(() => {
    if (!allowCustomValue || !currentSearchQuery) return false;
    
    const exists = flatOptions.some(option => 
      option.label.toLowerCase() === currentSearchQuery.toLowerCase() ||
      String(option.value).toLowerCase() === currentSearchQuery.toLowerCase()
    );
    
    return !exists && currentSearchQuery.length >= minSearchLength;
  }, [allowCustomValue, currentSearchQuery, flatOptions, minSearchLength]);

  // Handle creating new option from search
  const handleCreateOption = useCallback(async () => {
    if (!canCreateOption || !onCreateOption) return;

    try {
      const newOption = await onCreateOption(currentSearchQuery);
      baseSelect.handleSelect(newOption.value, newOption);
      setInternalSearchQuery('');
    } catch (error) {
      console.error('Failed to create option:', error);
    }
  }, [canCreateOption, onCreateOption, currentSearchQuery, baseSelect]);

  // Enhanced selection handler to track recent selections
  const handleSelect = useCallback((value: T, option?: SelectOption<T>) => {
    baseSelect.handleSelect(value, option);
    
    if (option && showRecentSelections) {
      setRecentSelections(prev => {
        const filtered = prev.filter(item => item.value !== value);
        return [option, ...filtered].slice(0, maxRecentSelections);
      });
    }
    
    setInternalSearchQuery('');
  }, [baseSelect, showRecentSelections, maxRecentSelections]);

  return {
    ...baseSelect,
    handleSelect,
    searchQuery: currentSearchQuery,
    setSearchQuery: handleSearchChange,
    debouncedSearchQuery,
    filteredOptions,
    isSearching: isSearching || isPending,
    recentSelections,
    handleSearchChange,
    handleCreateOption,
    canCreateOption,
  };
}

/**
 * Hook for multiple selection logic with chip management and batch operations
 * 
 * @param props - Multi-select component props
 * @returns Multi-select state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   selectedValues,
 *   selectedOptions,
 *   handleMultiSelect,
 *   removeValue,
 *   selectAll,
 *   isMaxReached
 * } = useMultiSelect({
 *   value: selectedTables,
 *   onChange: setSelectedTables,
 *   options: availableTables,
 *   maxSelections: 10
 * });
 * ```
 */
export function useMultiSelect<T = SelectValue, TFieldValues extends FieldValues = FieldValues>(
  props: MultiSelectProps<T, TFieldValues>
): UseMultiSelectReturn<T> {
  const {
    value,
    defaultValue = [],
    onChange,
    options = [],
    maxSelections,
    minSelections = 0,
    orderSelected = 'selection',
    closeOnSelect = false,
  } = props;

  const baseSelect = useSelect({ ...props, value: undefined });
  const [internalValues, setInternalValues] = useState<T[]>(value ?? defaultValue);

  const isControlled = value !== undefined;
  const currentValues = isControlled ? value : internalValues;

  // Get options handling
  const { flatOptions, findOption } = useSelectOptions(options);

  // Get selected options with metadata
  const selectedOptions = useMemo(() => {
    const options = currentValues.map(val => findOption(val)).filter(Boolean) as SelectOption<T>[];
    
    switch (orderSelected) {
      case 'alphabetical':
        return options.sort((a, b) => a.label.localeCompare(b.label));
      case 'original':
        return options.sort((a, b) => {
          const aIndex = flatOptions.findIndex(opt => opt.value === a.value);
          const bIndex = flatOptions.findIndex(opt => opt.value === b.value);
          return aIndex - bIndex;
        });
      default: // 'selection' order
        return options;
    }
  }, [currentValues, findOption, orderSelected, flatOptions]);

  // Selection constraints
  const selectionCount = currentValues.length;
  const isMaxReached = maxSelections ? selectionCount >= maxSelections : false;
  const isAllSelected = flatOptions.length > 0 && currentValues.length === flatOptions.length;

  // Handle multi-selection
  const handleMultiSelect = useCallback((selectedValue: T, option?: SelectOption<T>) => {
    if (isMaxReached && !currentValues.includes(selectedValue)) {
      return;
    }

    const newValues = currentValues.includes(selectedValue)
      ? currentValues.filter(val => val !== selectedValue)
      : [...currentValues, selectedValue];

    if (!isControlled) {
      setInternalValues(newValues);
    }

    onChange?.(newValues, newValues.map(val => findOption(val)).filter(Boolean) as SelectOption<T>[]);
    
    if (!closeOnSelect) {
      baseSelect.setIsOpen(true);
    }
  }, [currentValues, isMaxReached, isControlled, onChange, findOption, closeOnSelect, baseSelect]);

  // Remove specific value
  const removeValue = useCallback((valueToRemove: T) => {
    const newValues = currentValues.filter(val => val !== valueToRemove);
    
    if (!isControlled) {
      setInternalValues(newValues);
    }
    
    onChange?.(newValues, newValues.map(val => findOption(val)).filter(Boolean) as SelectOption<T>[]);
  }, [currentValues, isControlled, onChange, findOption]);

  // Select all options
  const selectAll = useCallback(() => {
    const allValues = flatOptions.slice(0, maxSelections).map(opt => opt.value);
    
    if (!isControlled) {
      setInternalValues(allValues);
    }
    
    onChange?.(allValues, flatOptions.slice(0, maxSelections));
  }, [flatOptions, maxSelections, isControlled, onChange]);

  // Clear all selections
  const clearAll = useCallback(() => {
    const emptyValues: T[] = [];
    
    if (!isControlled) {
      setInternalValues(emptyValues);
    }
    
    onChange?.(emptyValues, []);
  }, [isControlled, onChange]);

  return {
    ...baseSelect,
    selectedValues: currentValues,
    selectedOptions,
    handleSelect: handleMultiSelect,
    handleMultiSelect,
    removeValue,
    selectAll,
    clearAll: clearAll,
    isAllSelected,
    selectionCount,
    isMaxReached,
  };
}

/**
 * Hook for option normalization and group processing
 * 
 * @param options - Raw options array or grouped options
 * @returns Normalized options with utility functions
 * 
 * @example
 * ```tsx
 * const {
 *   flatOptions,
 *   groupedOptions,
 *   findOption,
 *   getDisplayLabel
 * } = useSelectOptions(databaseConnections);
 * ```
 */
export function useSelectOptions<T = SelectValue>(
  options: SelectOption<T>[] | OptionGroup<T>[]
): UseSelectOptionsReturn<T> {
  // Determine if options are grouped
  const hasGroups = options.length > 0 && 'options' in options[0];

  // Create flat options array
  const flatOptions = useMemo(() => {
    if (hasGroups) {
      return (options as OptionGroup<T>[]).flatMap(group => group.options);
    }
    return options as SelectOption<T>[];
  }, [options, hasGroups]);

  // Create grouped options array
  const groupedOptions = useMemo(() => {
    if (hasGroups) {
      return options as OptionGroup<T>[];
    }
    return [];
  }, [options, hasGroups]);

  // Find option by value
  const findOption = useCallback((value: T): SelectOption<T> | undefined => {
    return flatOptions.find(option => option.value === value);
  }, [flatOptions]);

  // Get display label for value
  const getDisplayLabel = useCallback((value: T): string => {
    const option = findOption(value);
    return option?.label || String(value);
  }, [findOption]);

  // Filter options by search query
  const filterOptions = useCallback((query: string): SelectOption<T>[] => {
    if (!query) return flatOptions;

    const searchTerm = query.toLowerCase();
    return flatOptions.filter(option => {
      const labelMatch = option.label.toLowerCase().includes(searchTerm);
      const valueMatch = String(option.value).toLowerCase().includes(searchTerm);
      const keywordMatch = option.searchKeywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      );
      
      return labelMatch || valueMatch || keywordMatch;
    });
  }, [flatOptions]);

  return {
    flatOptions,
    groupedOptions,
    findOption,
    getDisplayLabel,
    filterOptions,
    hasGroups,
  };
}

/**
 * Hook for consistent keyboard navigation across select variants
 * 
 * @param options - Available options for navigation
 * @param onSelect - Selection handler
 * @param isOpen - Whether dropdown is open
 * @returns Keyboard navigation state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   highlightedIndex,
 *   handleKeyDown,
 *   selectHighlighted
 * } = useSelectKeyboard(
 *   filteredOptions,
 *   handleSelect,
 *   isOpen
 * );
 * ```
 */
export function useSelectKeyboard<T = SelectValue>(
  options: SelectOption<T>[],
  onSelect: (value: T, option?: SelectOption<T>) => void,
  isOpen: boolean,
  onToggleOpen?: (open: boolean) => void
): UseSelectKeyboardReturn {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Reset highlight when options change or dropdown closes
  useEffect(() => {
    if (!isOpen || options.length === 0) {
      setHighlightedIndex(-1);
    } else if (highlightedIndex >= options.length) {
      setHighlightedIndex(options.length - 1);
    }
  }, [isOpen, options, highlightedIndex]);

  const moveHighlightUp = useCallback(() => {
    setHighlightedIndex(prev => {
      if (prev <= 0) return options.length - 1;
      return prev - 1;
    });
  }, [options.length]);

  const moveHighlightDown = useCallback(() => {
    setHighlightedIndex(prev => {
      if (prev >= options.length - 1) return 0;
      return prev + 1;
    });
  }, [options.length]);

  const selectHighlighted = useCallback(() => {
    if (highlightedIndex >= 0 && highlightedIndex < options.length) {
      const option = options[highlightedIndex];
      onSelect(option.value, option);
    }
  }, [highlightedIndex, options, onSelect]);

  const resetHighlight = useCallback(() => {
    setHighlightedIndex(0);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          onToggleOpen?.(true);
          resetHighlight();
        } else {
          moveHighlightDown();
        }
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          onToggleOpen?.(true);
          resetHighlight();
        } else {
          moveHighlightUp();
        }
        break;
      
      case 'Enter':
        event.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          selectHighlighted();
        } else {
          onToggleOpen?.(!isOpen);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        if (isOpen) {
          onToggleOpen?.(false);
        }
        break;
      
      case 'Tab':
        if (isOpen) {
          onToggleOpen?.(false);
        }
        break;
    }
  }, [isOpen, highlightedIndex, moveHighlightUp, moveHighlightDown, selectHighlighted, resetHighlight, onToggleOpen]);

  return {
    highlightedIndex,
    setHighlightedIndex,
    moveHighlightUp,
    moveHighlightDown,
    selectHighlighted,
    resetHighlight,
    handleKeyDown,
  };
}

/**
 * Hook for form integration and error handling with React Hook Form
 * 
 * @param name - Field name for form registration
 * @param rules - Validation rules
 * @param customValidation - Custom validation function
 * @returns Validation state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   error,
 *   isValid,
 *   validate,
 *   register
 * } = useSelectValidation('databaseType', {
 *   required: 'Database type is required'
 * });
 * ```
 */
export function useSelectValidation<TFieldValues extends FieldValues = FieldValues>(
  name?: FieldPath<TFieldValues>,
  rules?: any,
  customValidation?: (value: any) => string | undefined
): UseSelectValidationReturn {
  const formContext = useFormContext<TFieldValues>();
  const [error, setError] = useState<string | undefined>();

  const isRequired = Boolean(rules?.required);

  // Get validation error from form context
  useEffect(() => {
    if (formContext && name) {
      const fieldError = formContext.formState.errors[name];
      setError(fieldError?.message as string);
    }
  }, [formContext, name]);

  // Validation function
  const validate = useCallback((value: any): string | undefined => {
    // Check required validation
    if (isRequired && (value === undefined || value === null || value === '')) {
      const requiredMessage = typeof rules?.required === 'string' 
        ? rules.required 
        : 'This field is required';
      return requiredMessage;
    }

    // Run custom validation
    if (customValidation) {
      return customValidation(value);
    }

    return undefined;
  }, [isRequired, rules, customValidation]);

  const clearError = useCallback(() => {
    setError(undefined);
  }, []);

  // Form registration
  const register = useMemo(() => {
    if (formContext && name) {
      return formContext.register(name, {
        ...rules,
        validate: validate,
      });
    }
    return {};
  }, [formContext, name, rules, validate]);

  const isValid = !error;

  return {
    error,
    isValid,
    isRequired,
    validate,
    clearError,
    register,
  };
}

/**
 * Hook for HTTP verb bitmask conversions from Angular df-verb-picker component
 * Transforms verb selections between bitmask integer and array representations
 * 
 * @param value - Current bitmask value or verb array
 * @param onChange - Change handler for transformed value
 * @returns Verb transformation utilities
 * 
 * @example
 * ```tsx
 * const {
 *   selectedVerbs,
 *   bitmaskValue,
 *   toggleVerb,
 *   selectAllVerbs,
 *   getVerbLabels
 * } = useVerbTransform(selectedVerbBitmask, onChange);
 * ```
 */
export function useVerbTransform(
  value: number | string[] | undefined,
  onChange?: (value: number) => void
) {
  // HTTP verb definitions with bitmask values
  const HTTP_VERBS = useMemo(() => ({
    GET: 1,      // 2^0
    POST: 2,     // 2^1
    PUT: 4,      // 2^2
    PATCH: 8,    // 2^3
    DELETE: 16,  // 2^4
    HEAD: 32,    // 2^5
    OPTIONS: 64, // 2^6
  }), []);

  const VERB_LABELS = useMemo(() => ({
    1: 'GET',
    2: 'POST',
    4: 'PUT',
    8: 'PATCH',
    16: 'DELETE',
    32: 'HEAD',
    64: 'OPTIONS',
  }), []);

  // Convert bitmask to verb array
  const bitmaskToVerbs = useCallback((bitmask: number): string[] => {
    const verbs: string[] = [];
    Object.entries(HTTP_VERBS).forEach(([verb, bit]) => {
      if ((bitmask & bit) === bit) {
        verbs.push(verb);
      }
    });
    return verbs;
  }, [HTTP_VERBS]);

  // Convert verb array to bitmask
  const verbsToBitmask = useCallback((verbs: string[]): number => {
    return verbs.reduce((bitmask, verb) => {
      const bit = HTTP_VERBS[verb as keyof typeof HTTP_VERBS];
      return bit ? bitmask | bit : bitmask;
    }, 0);
  }, [HTTP_VERBS]);

  // Current state calculation
  const bitmaskValue = useMemo(() => {
    if (typeof value === 'number') {
      return value;
    } else if (Array.isArray(value)) {
      return verbsToBitmask(value);
    }
    return 0;
  }, [value, verbsToBitmask]);

  const selectedVerbs = useMemo(() => {
    return bitmaskToVerbs(bitmaskValue);
  }, [bitmaskValue, bitmaskToVerbs]);

  // Toggle individual verb
  const toggleVerb = useCallback((verb: string) => {
    const bit = HTTP_VERBS[verb as keyof typeof HTTP_VERBS];
    if (!bit) return;

    const newBitmask = bitmaskValue ^ bit; // XOR to toggle
    onChange?.(newBitmask);
  }, [bitmaskValue, HTTP_VERBS, onChange]);

  // Select all verbs
  const selectAllVerbs = useCallback(() => {
    const allVerbsBitmask = Object.values(HTTP_VERBS).reduce((acc, bit) => acc | bit, 0);
    onChange?.(allVerbsBitmask);
  }, [HTTP_VERBS, onChange]);

  // Clear all verbs
  const clearAllVerbs = useCallback(() => {
    onChange?.(0);
  }, [onChange]);

  // Check if specific verb is selected
  const isVerbSelected = useCallback((verb: string): boolean => {
    const bit = HTTP_VERBS[verb as keyof typeof HTTP_VERBS];
    return bit ? (bitmaskValue & bit) === bit : false;
  }, [bitmaskValue, HTTP_VERBS]);

  // Get human-readable labels for selected verbs
  const getVerbLabels = useCallback((): string[] => {
    return selectedVerbs;
  }, [selectedVerbs]);

  // Get all available verbs
  const getAllVerbs = useCallback((): string[] => {
    return Object.keys(HTTP_VERBS);
  }, [HTTP_VERBS]);

  // Validate bitmask value
  const isValidBitmask = useCallback((bitmask: number): boolean => {
    const maxBitmask = Object.values(HTTP_VERBS).reduce((acc, bit) => acc | bit, 0);
    return bitmask >= 0 && bitmask <= maxBitmask;
  }, [HTTP_VERBS]);

  return {
    selectedVerbs,
    bitmaskValue,
    toggleVerb,
    selectAllVerbs,
    clearAllVerbs,
    isVerbSelected,
    getVerbLabels,
    getAllVerbs,
    isValidBitmask,
    verbOptions: useMemo(() => 
      Object.keys(HTTP_VERBS).map(verb => ({
        value: verb,
        label: verb,
        disabled: false,
      })), [HTTP_VERBS]
    ),
  };
}

/**
 * Advanced hook for complex select scenarios with bitmask operations and hierarchical data
 * 
 * @param props - Advanced select component props
 * @returns Advanced select state and handlers
 * 
 * @example
 * ```tsx
 * const {
 *   selectedValue,
 *   handleBitmaskToggle,
 *   hierarchicalOptions,
 *   validateSelection
 * } = useAdvancedSelect({
 *   value: permissions,
 *   bitmaskMode: true,
 *   hierarchical: true,
 *   options: permissionOptions
 * });
 * ```
 */
export function useAdvancedSelect<T = SelectValue, TFieldValues extends FieldValues = FieldValues>(
  props: AdvancedSelectProps<T, TFieldValues>
): UseSelectReturn<T> & {
  handleBitmaskToggle: (bit: number) => void;
  bitmaskValue: BitmaskValue | undefined;
  hierarchicalSelection: Map<string, boolean>;
  validateSelection: () => string | undefined;
} {
  const {
    bitmaskMode = false,
    bitmaskConfig,
    hierarchical = false,
    hierarchy,
    customValidation,
  } = props;

  const baseSelect = useSelect(props);

  // Bitmask operations
  const bitmaskValue = useMemo((): BitmaskValue | undefined => {
    if (!bitmaskMode || !bitmaskConfig || typeof baseSelect.selectedValue !== 'number') {
      return undefined;
    }

    const value = baseSelect.selectedValue as number;
    const selectedBits: number[] = [];
    
    Object.keys(bitmaskConfig.bitLabels).forEach(bitStr => {
      const bit = parseInt(bitStr);
      if ((value & (1 << bit)) !== 0) {
        selectedBits.push(bit);
      }
    });

    return {
      value,
      selectedBits,
      labels: bitmaskConfig.bitLabels,
    };
  }, [bitmaskMode, bitmaskConfig, baseSelect.selectedValue]);

  const handleBitmaskToggle = useCallback((bit: number) => {
    if (!bitmaskMode || typeof baseSelect.selectedValue !== 'number') return;

    const currentValue = baseSelect.selectedValue as number;
    const newValue = currentValue ^ (1 << bit); // XOR to toggle bit
    baseSelect.handleSelect(newValue as T);
  }, [bitmaskMode, baseSelect]);

  // Hierarchical selection state
  const [hierarchicalSelection, setHierarchicalSelection] = useState<Map<string, boolean>>(new Map());

  // Custom validation
  const validateSelection = useCallback((): string | undefined => {
    if (customValidation?.validate) {
      const result = customValidation.validate(baseSelect.selectedValue);
      return typeof result === 'string' ? result : undefined;
    }
    return undefined;
  }, [customValidation, baseSelect.selectedValue]);

  return {
    ...baseSelect,
    handleBitmaskToggle,
    bitmaskValue,
    hierarchicalSelection,
    validateSelection,
  };
}

/**
 * Utility hook for managing select loading and error states
 * 
 * @param initialLoading - Initial loading state
 * @returns Loading and error state management
 */
export function useSelectState(initialLoading = false) {
  const [loadingState, setLoadingState] = useState<SelectLoadingState>({
    isLoading: initialLoading,
    type: 'initial',
  });
  const [errorState, setErrorState] = useState<SelectErrorState | undefined>();

  const setLoading = useCallback((loading: boolean, type: SelectLoadingState['type'] = 'initial', message?: string) => {
    setLoadingState({
      isLoading: loading,
      type,
      message,
    });
  }, []);

  const setError = useCallback((error: string | SelectErrorState) => {
    if (typeof error === 'string') {
      setErrorState({ message: error, type: 'validation' });
    } else {
      setErrorState(error);
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState(undefined);
  }, []);

  return {
    loadingState,
    errorState,
    setLoading,
    setError,
    clearError,
  };
}

// Export all hooks for easy consumption
export {
  useSelect,
  useAutocomplete,
  useMultiSelect,
  useSelectOptions,
  useSelectKeyboard,
  useSelectValidation,
  useVerbTransform,
  useAdvancedSelect,
  useSelectState,
};