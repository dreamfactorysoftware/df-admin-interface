/**
 * Custom React hooks for HTTP verb picker component functionality
 * Provides comprehensive verb selection logic, form integration, keyboard navigation,
 * and theme support for the DreamFactory Admin Interface verb picker component.
 * 
 * @fileoverview Replaces Angular df-verb-picker reactive patterns with React hooks
 * that integrate with React Hook Form, SWR/React Query caching, and Next.js middleware.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import {
  type HttpVerb,
  type VerbPickerMode,
  type VerbValue,
  type VerbOption,
  convertBitmaskToVerbs,
  convertVerbsToBitmask,
  transformValue,
  generateVerbOptions,
  validateVerbSelection,
  getSelectedVerbs,
  isVerbSelected,
  toggleVerb,
  HTTP_VERB_BITMASKS,
} from './utils';
import { useTheme } from '../../../hooks/useTheme';

// Hook interface types for comprehensive verb picker functionality
interface VerbPickerState {
  selectedValue: VerbValue | undefined;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  error?: string;
}

interface VerbPickerActions {
  setValue: (value: VerbValue | undefined) => void;
  toggleVerb: (verb: HttpVerb) => void;
  clearSelection: () => void;
  markAsTouched: () => void;
  validate: () => boolean;
}

interface VerbKeyboardNavigation {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  moveFocus: (direction: 'up' | 'down' | 'home' | 'end') => void;
}

interface VerbTransformOptions {
  fromMode: VerbPickerMode;
  toMode: VerbPickerMode;
  value: VerbValue | undefined;
}

interface VerbValidationOptions {
  required?: boolean;
  mode: VerbPickerMode;
  customValidator?: (value: VerbValue | undefined) => { isValid: boolean; error?: string };
}

interface VerbOptionsConfig {
  includeLabels?: boolean;
  customTranslations?: Record<string, string>;
  filterVerbs?: HttpVerb[];
}

interface ThemeModeState {
  isDark: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

/**
 * Core verb picker hook for selection state management
 * Provides comprehensive state management with mode-specific value handling,
 * validation, and reactive updates matching Angular ControlValueAccessor behavior.
 * 
 * @param initialValue - Initial verb selection value
 * @param mode - Selection mode (verb, verb_multiple, number)
 * @param options - Configuration options including validation
 * @returns Verb picker state and actions
 */
export function useVerbPicker(
  initialValue: VerbValue | undefined = undefined,
  mode: VerbPickerMode = 'verb',
  options: VerbValidationOptions = { required: false, mode }
): VerbPickerState & VerbPickerActions {
  const [selectedValue, setSelectedValue] = useState<VerbValue | undefined>(initialValue);
  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Memoized validation result
  const validationResult = useMemo(() => {
    const baseValidation = validateVerbSelection(selectedValue, mode, options.required);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    // Run custom validation if provided
    if (options.customValidator) {
      return options.customValidator(selectedValue);
    }

    return baseValidation;
  }, [selectedValue, mode, options.required, options.customValidator]);

  const isValid = validationResult.isValid;

  // Update error state when validation changes
  useEffect(() => {
    setError(validationResult.error);
  }, [validationResult.error]);

  // Action handlers with proper state management
  const setValue = useCallback((value: VerbValue | undefined) => {
    setSelectedValue(value);
    setIsDirty(true);
  }, []);

  const toggleVerbSelection = useCallback((verb: HttpVerb) => {
    const newValue = toggleVerb(selectedValue, mode, verb);
    setValue(newValue);
  }, [selectedValue, mode, setValue]);

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
    toggleVerb: toggleVerbSelection,
    clearSelection,
    markAsTouched,
    validate,
  };
}

/**
 * Value transformation hook for bitmask conversions
 * Handles conversion between different verb picker modes with comprehensive
 * bitmask operations (1=GET, 2=POST, 4=PUT, 8=PATCH, 16=DELETE).
 * 
 * @param options - Transformation configuration
 * @returns Transformed value and transformation utilities
 */
export function useVerbTransform(options: VerbTransformOptions) {
  const { fromMode, toMode, value } = options;

  // Memoized transformation result
  const transformedValue = useMemo(() => {
    return transformValue(value, fromMode, toMode);
  }, [value, fromMode, toMode]);

  // Utility functions for common transformations
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
    originalValue: value,
    hasChanged: transformedValue !== value,
  };
}

/**
 * React Hook Form integration hook for validation and form state management
 * Provides seamless integration with React Hook Form including validation,
 * error handling, and form state synchronization.
 * 
 * @param name - Form field name
 * @param mode - Selection mode for validation rules
 * @param options - Validation configuration options
 * @returns Form integration state and handlers
 */
export function useVerbValidation<T extends FieldValues>(
  name: Path<T>,
  mode: VerbPickerMode,
  options: VerbValidationOptions = { required: false, mode }
) {
  const formContext = useFormContext<T>();
  const hasFormContext = !!formContext;

  // Form field state and methods when form context is available
  const formField = hasFormContext ? formContext.register(name, {
    required: options.required ? 'Verb selection is required' : false,
    validate: (value) => {
      const validation = validateVerbSelection(value, mode, options.required);
      if (!validation.isValid) {
        return validation.error;
      }

      // Run custom validation if provided
      if (options.customValidator) {
        const customResult = options.customValidator(value);
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
  const setValue = useCallback((value: VerbValue | undefined) => {
    if (hasFormContext) {
      formContext.setValue(name, value as any, { shouldValidate: true, shouldDirty: true });
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

  // Selected verbs for current value
  const selectedVerbs = useMemo(() => {
    return getSelectedVerbs(fieldValue, mode);
  }, [fieldValue, mode]);

  return {
    ...formField,
    value: fieldValue,
    selectedVerbs,
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
 * Verb options hook for verb list management with internationalization support
 * Generates verb options with proper labeling, filtering, and translation support.
 * 
 * @param config - Options configuration including translations and filtering
 * @returns Verb options and management utilities
 */
export function useVerbOptions(config: VerbOptionsConfig = {}) {
  const {
    includeLabels = true,
    customTranslations = {},
    filterVerbs,
  } = config;

  // Translation function with custom overrides
  const translateVerb = useCallback((key: string) => {
    if (customTranslations[key]) {
      return customTranslations[key];
    }

    // Default translations matching Angular implementation
    const defaultTranslations = {
      'verbs.get': 'GET',
      'verbs.post': 'POST',
      'verbs.put': 'PUT',
      'verbs.patch': 'PATCH',
      'verbs.delete': 'DELETE',
    };

    return defaultTranslations[key as keyof typeof defaultTranslations] || key;
  }, [customTranslations]);

  // Memoized verb options with filtering and translation
  const verbOptions = useMemo(() => {
    const allOptions = generateVerbOptions(includeLabels ? translateVerb : undefined);
    
    if (filterVerbs && filterVerbs.length > 0) {
      return allOptions.filter(option => filterVerbs.includes(option.altValue));
    }

    return allOptions;
  }, [includeLabels, translateVerb, filterVerbs]);

  // Helper functions
  const getOptionByVerb = useCallback((verb: HttpVerb) => {
    return verbOptions.find(option => option.altValue === verb);
  }, [verbOptions]);

  const getOptionByValue = useCallback((value: number) => {
    return verbOptions.find(option => option.value === value);
  }, [verbOptions]);

  const isVerbAvailable = useCallback((verb: HttpVerb) => {
    return verbOptions.some(option => option.altValue === verb);
  }, [verbOptions]);

  return {
    verbOptions,
    getOptionByVerb,
    getOptionByValue,
    isVerbAvailable,
    translateVerb,
    totalOptions: verbOptions.length,
  };
}

/**
 * Keyboard navigation hook for consistent keyboard interactions
 * Provides arrow key navigation, enter/escape handling, and focus management
 * matching accessibility standards and Angular Material keyboard patterns.
 * 
 * @param verbOptions - Available verb options for navigation
 * @param onSelection - Callback when a verb is selected
 * @param onEscape - Callback when escape is pressed
 * @returns Keyboard navigation state and handlers
 */
export function useVerbKeyboard(
  verbOptions: VerbOption[],
  onSelection?: (verb: HttpVerb) => void,
  onEscape?: () => void
): VerbKeyboardNavigation {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clamp focused index to valid range
  const clampedFocusedIndex = useMemo(() => {
    return Math.max(0, Math.min(focusedIndex, verbOptions.length - 1));
  }, [focusedIndex, verbOptions.length]);

  // Update focused index with clamping
  const updateFocusedIndex = useCallback((newIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(newIndex, verbOptions.length - 1));
    setFocusedIndex(clampedIndex);
  }, [verbOptions.length]);

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
        updateFocusedIndex(verbOptions.length - 1);
        break;
    }
  }, [clampedFocusedIndex, updateFocusedIndex, verbOptions.length]);

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
        if (verbOptions[clampedFocusedIndex] && onSelection) {
          onSelection(verbOptions[clampedFocusedIndex].altValue);
        }
        break;
      case 'Escape':
        event.preventDefault();
        if (onEscape) {
          onEscape();
        }
        break;
    }
  }, [moveFocus, clampedFocusedIndex, verbOptions, onSelection, onEscape]);

  // Reset focus when options change
  useEffect(() => {
    if (verbOptions.length > 0 && clampedFocusedIndex >= verbOptions.length) {
      setFocusedIndex(verbOptions.length - 1);
    }
  }, [verbOptions.length, clampedFocusedIndex]);

  return {
    focusedIndex: clampedFocusedIndex,
    setFocusedIndex: updateFocusedIndex,
    handleKeyDown,
    moveFocus,
  };
}

/**
 * Theme mode hook for dark/light theme switching integration
 * Provides convenient access to theme state and controls specifically
 * for verb picker styling and theme-aware component behavior.
 * 
 * @returns Theme state and controls
 */
export function useThemeMode(): ThemeModeState {
  const { theme, setTheme, isDark } = useTheme();

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const setThemeMode = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  }, [setTheme]);

  return {
    isDark,
    theme,
    toggleTheme,
    setTheme: setThemeMode,
  };
}

/**
 * Composite hook that combines all verb picker functionality
 * Provides a convenient interface for components that need complete
 * verb picker functionality with form integration and keyboard support.
 * 
 * @param name - Form field name (optional)
 * @param initialValue - Initial selection value
 * @param mode - Selection mode
 * @param options - Configuration options
 * @returns Complete verb picker functionality
 */
export function useCompleteVerbPicker<T extends FieldValues>(
  name?: Path<T>,
  initialValue?: VerbValue,
  mode: VerbPickerMode = 'verb',
  options: VerbValidationOptions & VerbOptionsConfig = { required: false, mode }
) {
  // Core state management
  const picker = useVerbPicker(initialValue, mode, options);
  
  // Form integration (optional)
  const formIntegration = name ? useVerbValidation(name, mode, options) : null;
  
  // Verb options and utilities
  const verbOptions = useVerbOptions(options);
  
  // Keyboard navigation
  const keyboard = useVerbKeyboard(
    verbOptions.verbOptions,
    (verb: HttpVerb) => {
      if (formIntegration) {
        const currentSelected = getSelectedVerbs(formIntegration.value, mode);
        const newValue = toggleVerb(formIntegration.value, mode, verb);
        formIntegration.setValue(newValue);
      } else {
        picker.toggleVerb(verb);
      }
    },
    () => {
      // Handle escape - could close dropdown or clear selection
      if (formIntegration) {
        formIntegration.clearErrors();
      }
    }
  );
  
  // Theme integration
  const theme = useThemeMode();

  // Helper to check if a verb is selected
  const isSelected = useCallback((verb: HttpVerb) => {
    const currentValue = formIntegration ? formIntegration.value : picker.selectedValue;
    return isVerbSelected(currentValue, mode, verb);
  }, [formIntegration, picker.selectedValue, mode]);

  // Combined value and state
  const currentValue = formIntegration ? formIntegration.value : picker.selectedValue;
  const selectedVerbs = getSelectedVerbs(currentValue, mode);
  const isValid = formIntegration ? formIntegration.isValid : picker.isValid;
  const error = formIntegration ? formIntegration.error : picker.error;

  return {
    // Current state
    value: currentValue,
    selectedVerbs,
    isValid,
    error,
    isDirty: formIntegration ? formIntegration.isDirty : picker.isDirty,
    isTouched: formIntegration ? formIntegration.isTouched : picker.isTouched,
    
    // Actions
    setValue: formIntegration ? formIntegration.setValue : picker.setValue,
    toggleVerb: (verb: HttpVerb) => {
      const newValue = toggleVerb(currentValue, mode, verb);
      if (formIntegration) {
        formIntegration.setValue(newValue);
      } else {
        picker.setValue(newValue);
      }
    },
    clearSelection: formIntegration ? () => formIntegration.setValue(undefined) : picker.clearSelection,
    validate: formIntegration ? formIntegration.trigger : () => Promise.resolve(picker.validate()),
    
    // Utilities
    isSelected,
    verbOptions: verbOptions.verbOptions,
    getOptionByVerb: verbOptions.getOptionByVerb,
    
    // Keyboard support
    keyboard,
    
    // Theme support
    theme,
    
    // Form integration
    hasFormContext: !!formIntegration,
    formField: formIntegration,
  };
}