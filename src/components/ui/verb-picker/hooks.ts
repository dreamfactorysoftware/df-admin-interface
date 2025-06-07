/**
 * Custom React hooks for HTTP verb picker component
 * 
 * Provides comprehensive hook collection for verb selection state management,
 * bitmask transformations, React Hook Form integration, keyboard navigation,
 * and theme integration. Optimized for React 19 concurrent features with
 * proper dependency arrays and performance optimization.
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useController, type UseControllerProps, type FieldPath, type FieldValues } from 'react-hook-form';
import {
  type HttpVerb,
  type VerbOption,
  type VerbPickerMode,
  type VerbPickerAnyValue,
  type VerbValidationResult,
  type ConfigSchema,
  type UseVerbPickerReturn,
  type UseVerbTransformReturn,
  type VerbPickerKeyboardHandlers,
  type ThemeVariant,
} from './types';
import {
  convertBitmaskToVerbs,
  convertVerbsToBitmask,
  convertVerbToBitmask,
  convertBitmaskToVerb,
  transformValue,
  generateVerbOptions,
  generateVerbOptionsFromSchema,
  validateVerbSelection,
  getSelectedVerbs,
  isVerbSelected,
  toggleVerbSelection,
  formatVerbDisplay,
} from './utils';

// ============================================================================
// Core Selection State Management Hook
// ============================================================================

/**
 * Primary hook for verb picker selection state management
 * 
 * Provides comprehensive state management for HTTP verb selection with support
 * for different modes (single, multiple, numeric). Handles value transformations,
 * selection logic, and provides optimized methods for common operations.
 * 
 * @param mode - Selection mode (verb, verb_multiple, number)
 * @param initialValue - Initial selected value(s)
 * @param onChange - Change callback for external integration
 * @param options - Additional configuration options
 * 
 * @example
 * ```typescript
 * const {
 *   value,
 *   setValue,
 *   selectedOptions,
 *   toggle,
 *   clear,
 *   isSelected
 * } = useVerbPicker('verb_multiple', ['GET', 'POST']);
 * ```
 */
export function useVerbPicker(
  mode: VerbPickerMode = 'verb_multiple',
  initialValue?: VerbPickerAnyValue,
  onChange?: (value: VerbPickerAnyValue) => void,
  options: {
    verbOptions?: VerbOption[];
    maxSelections?: number;
    minSelections?: number;
  } = {}
): UseVerbPickerReturn {
  const { verbOptions = generateVerbOptions(), maxSelections, minSelections } = options;

  // Initialize state with proper type handling
  const [internalValue, setInternalValue] = useState<VerbPickerAnyValue>(() => {
    if (initialValue !== undefined) {
      return initialValue;
    }
    
    // Set appropriate default based on mode
    switch (mode) {
      case 'verb':
        return null;
      case 'verb_multiple':
        return [];
      case 'number':
        return 0;
      default:
        return null;
    }
  });

  // Update internal value when initialValue changes
  useEffect(() => {
    if (initialValue !== undefined) {
      setInternalValue(initialValue);
    }
  }, [initialValue]);

  // Memoized selected verbs for performance
  const selectedVerbs = useMemo(() => 
    getSelectedVerbs(internalValue, mode),
    [internalValue, mode]
  );

  // Memoized selected options for UI rendering
  const selectedOptions = useMemo(() => 
    verbOptions.filter(option => 
      selectedVerbs.includes(option.altValue)
    ),
    [verbOptions, selectedVerbs]
  );

  // Check if any options are selected
  const hasSelection = selectedVerbs.length > 0;

  // Optimized setValue function with validation
  const setValue = useCallback((newValue: VerbPickerAnyValue) => {
    // Validate selection count constraints
    const newVerbs = getSelectedVerbs(newValue, mode);
    
    if (maxSelections !== undefined && newVerbs.length > maxSelections) {
      return; // Reject if exceeds maximum
    }
    
    if (minSelections !== undefined && newVerbs.length < minSelections) {
      // Allow setting to meet minimum requirement
    }
    
    setInternalValue(newValue);
    onChange?.(newValue);
  }, [mode, maxSelections, minSelections, onChange]);

  // Clear all selections
  const clear = useCallback(() => {
    const emptyValue = mode === 'verb_multiple' ? [] : 
                     mode === 'number' ? 0 : null;
    setValue(emptyValue);
  }, [mode, setValue]);

  // Select all available options (multiple mode only)
  const selectAll = useCallback(() => {
    if (mode !== 'verb_multiple') return;
    
    const allVerbs = verbOptions.map(option => option.altValue);
    const limitedVerbs = maxSelections 
      ? allVerbs.slice(0, maxSelections)
      : allVerbs;
    
    setValue(limitedVerbs);
  }, [mode, verbOptions, maxSelections, setValue]);

  // Toggle specific verb selection
  const toggle = useCallback((verb: HttpVerb) => {
    const newValue = toggleVerbSelection(internalValue, verb, mode);
    setValue(newValue);
  }, [internalValue, mode, setValue]);

  // Check if specific verb is selected
  const isSelected = useCallback((verb: HttpVerb) => 
    isVerbSelected(internalValue, verb, mode),
    [internalValue, mode]
  );

  return {
    value: internalValue,
    setValue,
    selectedOptions,
    hasSelection,
    clear,
    selectAll,
    toggle,
    isSelected,
  };
}

// ============================================================================
// Value Transformation Hook
// ============================================================================

/**
 * Hook for HTTP verb value transformations and bitmask operations
 * 
 * Provides utilities for converting between different value formats:
 * single verbs, verb arrays, and numeric bitmasks. Optimized with
 * memoization for frequent transformation operations.
 * 
 * @example
 * ```typescript
 * const { transform, bitmaskToVerbs, verbsToBitmask } = useVerbTransform();
 * 
 * const verbs = bitmaskToVerbs(3); // ['GET', 'POST']
 * const bitmask = verbsToBitmask(['GET', 'POST']); // 3
 * ```
 */
export function useVerbTransform(): UseVerbTransformReturn {
  // Memoized transformation function
  const transform = useCallback((options: {
    value: VerbPickerAnyValue;
    fromMode: VerbPickerMode;
    toMode: VerbPickerMode;
  }) => {
    const { value, fromMode, toMode } = options;
    return transformValue(value, fromMode, toMode);
  }, []);

  // Memoized bitmask conversion functions for performance
  const bitmaskToVerbs = useCallback((bitmask: number): HttpVerb[] => 
    convertBitmaskToVerbs(bitmask), []
  );

  const verbsToBitmask = useCallback((verbs: HttpVerb[]): number => 
    convertVerbsToBitmask(verbs), []
  );

  const verbToBitmask = useCallback((verb: HttpVerb): number => 
    convertVerbToBitmask(verb), []
  );

  const bitmaskToVerb = useCallback((bitmask: number): HttpVerb | null => 
    convertBitmaskToVerb(bitmask), []
  );

  return {
    transform,
    bitmaskToVerbs,
    verbsToBitmask,
    verbToBitmask,
    bitmaskToVerb,
  };
}

// ============================================================================
// React Hook Form Integration Hook
// ============================================================================

/**
 * Hook for integrating verb picker with React Hook Form
 * 
 * Provides seamless integration with React Hook Form including validation,
 * error handling, and form state management. Supports all picker modes
 * with proper type safety and performance optimization.
 * 
 * @param name - Field name for form integration
 * @param control - React Hook Form control instance
 * @param rules - Validation rules
 * @param mode - Picker mode for value handling
 * @param options - Additional validation options
 * 
 * @example
 * ```typescript
 * const {
 *   field,
 *   fieldState,
 *   validate,
 *   isValid,
 *   error
 * } = useVerbValidation('httpMethods', control, {
 *   required: 'Please select at least one HTTP method'
 * });
 * ```
 */
export function useVerbValidation<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  name: TName,
  control?: UseControllerProps<TFieldValues, TName>['control'],
  rules?: UseControllerProps<TFieldValues, TName>['rules'],
  mode: VerbPickerMode = 'verb_multiple',
  options: {
    required?: boolean;
    maxSelections?: number;
    minSelections?: number;
    allowedVerbs?: HttpVerb[];
    customValidator?: (value: VerbPickerAnyValue) => VerbValidationResult;
  } = {}
) {
  const {
    required = false,
    maxSelections,
    minSelections,
    allowedVerbs,
    customValidator,
  } = options;

  // React Hook Form controller integration
  const {
    field,
    fieldState,
  } = useController({
    name,
    control,
    rules: {
      ...rules,
      validate: (value: VerbPickerAnyValue) => {
        // Custom validator takes precedence
        if (customValidator) {
          const result = customValidator(value);
          return result.isValid || result.error || 'Invalid selection';
        }

        // Standard validation
        const result = validateVerbSelection(value, mode, {
          required,
          maxSelections,
          minSelections,
          allowedVerbs,
          fieldName: name,
        });

        return result.isValid || result.error || 'Invalid selection';
      },
    },
  });

  // Manual validation function for external use
  const validate = useCallback((value: VerbPickerAnyValue): VerbValidationResult => {
    if (customValidator) {
      return customValidator(value);
    }

    return validateVerbSelection(value, mode, {
      required,
      maxSelections,
      minSelections,
      allowedVerbs,
      fieldName: name,
    });
  }, [customValidator, mode, required, maxSelections, minSelections, allowedVerbs, name]);

  // Computed validation state
  const isValid = !fieldState.error;
  const error = fieldState.error?.message;

  return {
    field,
    fieldState,
    validate,
    isValid,
    error,
  };
}

// ============================================================================
// Verb Options Management Hook
// ============================================================================

/**
 * Hook for managing verb options with internationalization support
 * 
 * Generates and manages verb options for the picker component with support
 * for custom labels, filtering, and schema-based configuration. Includes
 * memoization for performance optimization.
 * 
 * @param schema - Configuration schema for options
 * @param customLabels - Custom labels for verbs
 * @param includedVerbs - Subset of verbs to include
 * @param i18nLabels - Internationalized labels (future extension)
 * 
 * @example
 * ```typescript
 * const { verbOptions, updateLabels, filterOptions } = useVerbOptions({
 *   customLabels: { GET: 'Retrieve', POST: 'Create' }
 * });
 * ```
 */
export function useVerbOptions(
  schema?: Partial<ConfigSchema>,
  customLabels?: Partial<Record<HttpVerb, string>>,
  includedVerbs?: HttpVerb[],
  i18nLabels?: Partial<Record<HttpVerb, string>>
) {
  // State for dynamic label updates
  const [labels, setLabels] = useState<Partial<Record<HttpVerb, string>>>(
    () => ({ ...customLabels, ...i18nLabels })
  );

  // Memoized verb options generation
  const verbOptions = useMemo(() => {
    if (schema) {
      const schemaOptions = generateVerbOptionsFromSchema(schema);
      
      // Apply custom labels if provided
      if (labels && Object.keys(labels).length > 0) {
        return schemaOptions.map(option => ({
          ...option,
          label: labels[option.altValue] || option.label,
        }));
      }
      
      return schemaOptions;
    }

    return generateVerbOptions(labels, includedVerbs);
  }, [schema, labels, includedVerbs]);

  // Update labels dynamically
  const updateLabels = useCallback((newLabels: Partial<Record<HttpVerb, string>>) => {
    setLabels(prev => ({ ...prev, ...newLabels }));
  }, []);

  // Filter options based on criteria
  const filterOptions = useCallback((
    predicate: (option: VerbOption) => boolean
  ): VerbOption[] => {
    return verbOptions.filter(predicate);
  }, [verbOptions]);

  // Get display text for selected verbs
  const getDisplayText = useCallback((
    verbs: HttpVerb[],
    separator: string = ', '
  ): string => {
    return formatVerbDisplay(verbs, labels, separator);
  }, [labels]);

  return {
    verbOptions,
    updateLabels,
    filterOptions,
    getDisplayText,
    labels,
  };
}

// ============================================================================
// Keyboard Navigation Hook
// ============================================================================

/**
 * Hook for handling keyboard navigation in verb picker component
 * 
 * Implements comprehensive keyboard interaction patterns including arrow key
 * navigation, Enter/Space for selection, and Escape for closing. Optimized
 * for accessibility and performance with proper event handling.
 * 
 * @param verbOptions - Available verb options for navigation
 * @param onSelect - Selection callback
 * @param onClose - Close callback for dropdown
 * @param onOpen - Open callback for dropdown
 * @param isOpen - Current open state
 * 
 * @example
 * ```typescript
 * const {
 *   focusedIndex,
 *   handleKeyDown,
 *   resetFocus,
 *   focusNext,
 *   focusPrevious
 * } = useVerbKeyboard(verbOptions, handleSelect, handleClose);
 * ```
 */
export function useVerbKeyboard(
  verbOptions: VerbOption[],
  onSelect?: (verb: HttpVerb) => void,
  onClose?: () => void,
  onOpen?: () => void,
  isOpen?: boolean
) {
  // Track focused option index
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  
  // Reset focus when options change or component closes
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Navigate to next option
  const focusNext = useCallback(() => {
    setFocusedIndex(prev => {
      const next = prev + 1;
      return next >= verbOptions.length ? 0 : next;
    });
  }, [verbOptions.length]);

  // Navigate to previous option
  const focusPrevious = useCallback(() => {
    setFocusedIndex(prev => {
      const previous = prev - 1;
      return previous < 0 ? verbOptions.length - 1 : previous;
    });
  }, [verbOptions.length]);

  // Reset focus to first option
  const resetFocus = useCallback(() => {
    setFocusedIndex(0);
  }, []);

  // Comprehensive keyboard event handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          onOpen?.();
          resetFocus();
        } else {
          focusNext();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          onOpen?.();
          setFocusedIndex(verbOptions.length - 1);
        } else {
          focusPrevious();
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < verbOptions.length) {
          const selectedOption = verbOptions[focusedIndex];
          onSelect?.(selectedOption.altValue);
        } else if (!isOpen) {
          onOpen?.();
          resetFocus();
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (isOpen) {
          onClose?.();
          setFocusedIndex(-1);
        }
        break;

      case 'Home':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(0);
        }
        break;

      case 'End':
        if (isOpen) {
          event.preventDefault();
          setFocusedIndex(verbOptions.length - 1);
        }
        break;

      case 'Tab':
        // Allow tab to close dropdown naturally
        if (isOpen) {
          onClose?.();
        }
        break;

      default:
        // Handle character navigation for first letter matching
        if (event.key.length === 1 && isOpen) {
          const char = event.key.toLowerCase();
          const matchIndex = verbOptions.findIndex(option =>
            option.altValue.toLowerCase().startsWith(char)
          );
          
          if (matchIndex >= 0) {
            event.preventDefault();
            setFocusedIndex(matchIndex);
          }
        }
        break;
    }
  }, [
    isOpen,
    focusedIndex,
    verbOptions,
    onSelect,
    onClose,
    onOpen,
    focusNext,
    focusPrevious,
    resetFocus,
  ]);

  // Get currently focused option
  const focusedOption = useMemo(() => {
    return focusedIndex >= 0 && focusedIndex < verbOptions.length
      ? verbOptions[focusedIndex]
      : null;
  }, [focusedIndex, verbOptions]);

  return {
    focusedIndex,
    focusedOption,
    handleKeyDown,
    resetFocus,
    focusNext,
    focusPrevious,
    setFocusedIndex,
  };
}

// ============================================================================
// Theme Integration Hook
// ============================================================================

/**
 * Hook for theme integration with verb picker component
 * 
 * Provides theme-aware styling and dark mode support using Tailwind CSS
 * and system preferences. Includes optimized class generation and theme
 * switching capabilities.
 * 
 * @param variant - Theme variant (light, dark, system)
 * @param customTheme - Custom theme configuration
 * 
 * @example
 * ```typescript
 * const {
 *   theme,
 *   isDark,
 *   toggleTheme,
 *   getThemeClasses
 * } = useThemeMode('system');
 * ```
 */
export function useThemeMode(
  variant: ThemeVariant = 'system',
  customTheme?: Record<string, string>
) {
  // Track current theme preference
  const [theme, setTheme] = useState<ThemeVariant>(variant);
  
  // Track system preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(false);

  // Initialize system preference detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemPrefersDark(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemPrefersDark(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Determine if dark mode is active
  const isDark = useMemo(() => {
    switch (theme) {
      case 'dark':
        return true;
      case 'light':
        return false;
      case 'system':
        return systemPrefersDark;
      default:
        return false;
    }
  }, [theme, systemPrefersDark]);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      switch (prev) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'light';
        case 'system':
          return systemPrefersDark ? 'light' : 'dark';
        default:
          return 'light';
      }
    });
  }, [systemPrefersDark]);

  // Set specific theme
  const setThemeMode = useCallback((newTheme: ThemeVariant) => {
    setTheme(newTheme);
  }, []);

  // Generate theme-aware CSS classes
  const getThemeClasses = useCallback((
    baseClasses: string,
    lightClasses?: string,
    darkClasses?: string
  ): string => {
    const classes = [baseClasses];
    
    if (isDark && darkClasses) {
      classes.push(darkClasses);
    } else if (!isDark && lightClasses) {
      classes.push(lightClasses);
    }
    
    return classes.join(' ');
  }, [isDark]);

  // Predefined theme classes for verb picker components
  const themeClasses = useMemo(() => ({
    container: getThemeClasses(
      'border rounded-lg transition-colors duration-200',
      'border-gray-300 bg-white text-gray-900',
      'border-gray-600 bg-gray-800 text-gray-100'
    ),
    option: getThemeClasses(
      'px-3 py-2 cursor-pointer transition-colors duration-150',
      'hover:bg-gray-100 focus:bg-gray-100',
      'hover:bg-gray-700 focus:bg-gray-700'
    ),
    selectedOption: getThemeClasses(
      'px-3 py-2 cursor-pointer transition-colors duration-150',
      'bg-blue-100 text-blue-900 hover:bg-blue-200',
      'bg-blue-800 text-blue-100 hover:bg-blue-700'
    ),
    input: getThemeClasses(
      'border rounded px-3 py-2 transition-colors duration-200',
      'border-gray-300 bg-white text-gray-900 focus:border-blue-500',
      'border-gray-600 bg-gray-800 text-gray-100 focus:border-blue-400'
    ),
    error: getThemeClasses(
      'text-sm mt-1',
      'text-red-600',
      'text-red-400'
    ),
  }), [getThemeClasses]);

  return {
    theme,
    isDark,
    systemPrefersDark,
    toggleTheme,
    setThemeMode,
    getThemeClasses,
    themeClasses,
  };
}

// ============================================================================
// Composite Hook for Complete Integration
// ============================================================================

/**
 * Composite hook combining all verb picker functionality
 * 
 * Provides a single hook interface that combines selection state, validation,
 * keyboard navigation, and theme integration. Simplifies component implementation
 * while maintaining full access to individual hook capabilities.
 * 
 * @param config - Complete configuration object
 * 
 * @example
 * ```typescript
 * const verbPicker = useVerbPickerComplete({
 *   mode: 'verb_multiple',
 *   name: 'httpMethods',
 *   control: formControl,
 *   rules: { required: 'Selection required' },
 *   schema: fieldSchema,
 *   theme: 'system'
 * });
 * ```
 */
export function useVerbPickerComplete<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(config: {
  // Core configuration
  mode?: VerbPickerMode;
  initialValue?: VerbPickerAnyValue;
  onChange?: (value: VerbPickerAnyValue) => void;
  
  // React Hook Form integration
  name?: TName;
  control?: UseControllerProps<TFieldValues, TName>['control'];
  rules?: UseControllerProps<TFieldValues, TName>['rules'];
  
  // Options and validation
  schema?: Partial<ConfigSchema>;
  verbOptions?: VerbOption[];
  maxSelections?: number;
  minSelections?: number;
  required?: boolean;
  allowedVerbs?: HttpVerb[];
  
  // UI configuration
  theme?: ThemeVariant;
  customLabels?: Partial<Record<HttpVerb, string>>;
  
  // Event handlers
  onOpen?: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const {
    mode = 'verb_multiple',
    initialValue,
    onChange,
    name,
    control,
    rules,
    schema,
    verbOptions: customVerbOptions,
    maxSelections,
    minSelections,
    required = false,
    allowedVerbs,
    theme = 'system',
    customLabels,
    onOpen,
    onClose,
    onFocus,
    onBlur,
  } = config;

  // Generate verb options
  const { verbOptions } = useVerbOptions(schema, customLabels);
  const finalVerbOptions = customVerbOptions || verbOptions;

  // Core selection state
  const picker = useVerbPicker(mode, initialValue, onChange, {
    verbOptions: finalVerbOptions,
    maxSelections,
    minSelections,
  });

  // Value transformation utilities
  const transform = useVerbTransform();

  // Form integration (if form context provided)
  const validation = name && control ? useVerbValidation(
    name,
    control,
    rules,
    mode,
    {
      required,
      maxSelections,
      minSelections,
      allowedVerbs,
    }
  ) : null;

  // Keyboard navigation
  const [isOpen, setIsOpen] = useState(false);
  
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const keyboard = useVerbKeyboard(
    finalVerbOptions,
    picker.toggle,
    handleClose,
    handleOpen,
    isOpen
  );

  // Theme integration
  const themeMode = useThemeMode(theme);

  // Unified event handlers
  const handleFocus = useCallback(() => {
    onFocus?.();
    validation?.field.onBlur(); // Notify form of focus
  }, [onFocus, validation]);

  const handleBlur = useCallback(() => {
    onBlur?.();
    validation?.field.onBlur(); // Notify form of blur
  }, [onBlur, validation]);

  // Combined value for form integration
  const formValue = validation?.field.value ?? picker.value;

  return {
    // Core state and actions
    ...picker,
    value: formValue,
    
    // Transform utilities
    ...transform,
    
    // Validation state
    validation,
    isValid: validation?.isValid ?? true,
    error: validation?.error,
    
    // Keyboard navigation
    keyboard,
    isOpen,
    setIsOpen,
    
    // Theme support
    theme: themeMode,
    
    // Verb options
    verbOptions: finalVerbOptions,
    
    // Event handlers
    handleFocus,
    handleBlur,
    handleOpen,
    handleClose,
    
    // Component props helpers
    getInputProps: () => ({
      value: formValue,
      onChange: (value: VerbPickerAnyValue) => {
        picker.setValue(value);
        validation?.field.onChange(value);
      },
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: keyboard.handleKeyDown,
      'aria-expanded': isOpen,
      'aria-haspopup': 'listbox' as const,
      'aria-invalid': validation ? !validation.isValid : false,
    }),
    
    getOptionProps: (option: VerbOption, index: number) => ({
      key: option.value,
      onClick: () => picker.toggle(option.altValue),
      onMouseEnter: () => keyboard.setFocusedIndex(index),
      'aria-selected': picker.isSelected(option.altValue),
      tabIndex: -1,
      role: 'option',
      id: `verb-option-${option.value}`,
    }),
  };
}