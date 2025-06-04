/**
 * VerbPicker React Component
 * 
 * Comprehensive HTTP verb selection component built on Headless UI Listbox with Tailwind CSS styling.
 * Replaces Angular Material mat-select with modern React 19/Next.js 15.1 architecture.
 * 
 * Features:
 * - Accessible verb selection (GET, POST, PUT, PATCH, DELETE) with WCAG 2.1 AA compliance
 * - Three selection modes: 'verb' (single), 'verb_multiple' (array), 'number' (bitmask)
 * - React Hook Form integration with real-time validation under 100ms
 * - Bitmask value transformations (1=GET, 2=POST, 4=PUT, 8=PATCH, 16=DELETE)
 * - Theme support (light/dark) with Tailwind CSS
 * - Tooltip functionality using Headless UI
 * - ARIA labeling and keyboard navigation support
 * 
 * @fileoverview Replaces Angular df-verb-picker with React Hook Form and Headless UI integration
 */

import React, { forwardRef, useId, useMemo, useCallback } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useController, type FieldPath, type FieldValues } from 'react-hook-form';

// Internal component imports
import {
  type VerbPickerProps,
  type HttpVerb,
  type VerbPickerMode,
  type VerbPickerAnyValue,
  type VerbOption,
  type ConfigSchema,
} from './types';
import { 
  useCompleteVerbPicker,
  useVerbOptions,
  useThemeMode,
} from './hooks';
import {
  formatVerbDisplay,
  getSelectedVerbs,
  validateVerbSelection,
} from './utils';

// Utility function for combining class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Tooltip component for schema descriptions
 * Provides accessible tooltips using Headless UI with WCAG compliance
 */
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, disabled = false }) => {
  const tooltipId = useId();
  
  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className={cn(
          "absolute z-50 px-2 py-1 text-xs font-medium text-white",
          "bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-all duration-200 ease-in-out",
          "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
          "before:content-[''] before:absolute before:top-full before:left-1/2",
          "before:transform before:-translate-x-1/2 before:border-4",
          "before:border-transparent before:border-t-gray-900 dark:before:border-t-gray-700",
          "max-w-xs break-words whitespace-normal"
        )}
      >
        {content}
      </div>
    </div>
  );
};

/**
 * Verb option display component
 * Renders individual HTTP verb options with proper styling and selection states
 */
interface VerbOptionItemProps {
  option: VerbOption;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
  theme: 'light' | 'dark' | 'system';
}

const VerbOptionItem: React.FC<VerbOptionItemProps> = ({ 
  option, 
  selected, 
  active, 
  disabled = false,
  theme 
}) => {
  return (
    <li
      className={cn(
        "relative cursor-default select-none py-2 pl-3 pr-9",
        active && !disabled
          ? "bg-primary-600 text-white"
          : "text-gray-900 dark:text-gray-100",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
    >
      <div className="flex items-center">
        <span 
          className={cn(
            "block truncate font-medium",
            selected ? "font-semibold" : "font-normal"
          )}
        >
          {option.label}
        </span>
        <span 
          className={cn(
            "ml-2 text-xs",
            active && !disabled
              ? "text-primary-200"
              : "text-gray-500 dark:text-gray-400"
          )}
        >
          ({option.altValue})
        </span>
      </div>
      
      {selected && (
        <span 
          className={cn(
            "absolute inset-y-0 right-0 flex items-center pr-4",
            active && !disabled ? "text-white" : "text-primary-600"
          )}
        >
          <CheckIcon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </li>
  );
};

/**
 * Main VerbPicker component
 * Comprehensive HTTP verb selection with accessibility, validation, and theme support
 */
const VerbPicker = forwardRef<
  HTMLButtonElement,
  VerbPickerProps
>(({
  mode = 'verb',
  schema,
  size = 'md',
  theme: themeProp,
  verbOptions: customVerbOptions,
  defaultValue,
  value: controlledValue,
  onChange: onControlledChange,
  onFocus,
  onBlur,
  allowEmpty = true,
  maxSelections,
  minSelections,
  placeholder,
  control,
  name,
  rules,
  showTooltip = true,
  tooltipContent,
  className,
  id: providedId,
  'data-testid': testId,
  disabled = false,
  required = false,
  error: externalError,
  helperText,
  showLabel = true,
  ...restProps
}, ref) => {
  // Generate unique IDs for accessibility
  const generatedId = useId();
  const id = providedId || generatedId;
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  // Theme management
  const { theme: globalTheme } = useThemeMode();
  const effectiveTheme = themeProp || globalTheme;

  // Verb options with internationalization support
  const { verbOptions } = useVerbOptions({ 
    includeLabels: true,
    filterVerbs: customVerbOptions?.map(opt => opt.altValue)
  });
  
  const finalVerbOptions = customVerbOptions || verbOptions;

  // React Hook Form integration (when control and name are provided)
  const {
    field: controllerField,
    fieldState: { error: hookFormError, isDirty, isTouched }
  } = useController({
    name: name!,
    control,
    rules: {
      required: required ? 'Verb selection is required' : false,
      validate: (fieldValue) => {
        const validation = validateVerbSelection(fieldValue, mode, required);
        if (!validation.isValid) {
          return validation.error;
        }

        // Custom validation rules
        if (mode === 'verb_multiple' && Array.isArray(fieldValue)) {
          if (maxSelections && fieldValue.length > maxSelections) {
            return `Maximum ${maxSelections} verbs allowed`;
          }
          if (minSelections && fieldValue.length < minSelections) {
            return `Minimum ${minSelections} verbs required`;
          }
        }

        return true;
      },
      ...rules
    },
    defaultValue: defaultValue as any
  }) as any;

  // Determine current value and change handler
  const currentValue = controllerField?.value ?? controlledValue;
  const handleChange = controllerField?.onChange ?? onControlledChange;

  // Selected verbs for display
  const selectedVerbs = useMemo(() => {
    return getSelectedVerbs(currentValue, mode);
  }, [currentValue, mode]);

  // Error state management
  const error = externalError || hookFormError?.message;
  const hasError = Boolean(error);

  // Selection handlers
  const handleVerbSelect = useCallback((newValue: VerbPickerAnyValue) => {
    if (disabled) return;
    
    handleChange?.(newValue);
    
    // Mark field as touched for React Hook Form
    if (controllerField?.onBlur) {
      controllerField.onBlur();
    }
  }, [disabled, handleChange, controllerField]);

  const handleSingleVerbSelect = useCallback((verb: HttpVerb) => {
    const newValue = selectedVerbs.includes(verb) && allowEmpty ? undefined : verb;
    handleVerbSelect(newValue);
  }, [selectedVerbs, allowEmpty, handleVerbSelect]);

  const handleMultipleVerbToggle = useCallback((verb: HttpVerb) => {
    const isSelected = selectedVerbs.includes(verb);
    let newVerbs: HttpVerb[];
    
    if (isSelected) {
      newVerbs = selectedVerbs.filter(v => v !== verb);
    } else {
      if (maxSelections && selectedVerbs.length >= maxSelections) {
        return; // Don't add if at max selections
      }
      newVerbs = [...selectedVerbs, verb];
    }
    
    const newValue = mode === 'number' 
      ? newVerbs.reduce((bitmask, v) => {
          const verbBitmasks = { GET: 1, POST: 2, PUT: 4, PATCH: 8, DELETE: 16 };
          return bitmask | (verbBitmasks[v] || 0);
        }, 0)
      : newVerbs;
    
    handleVerbSelect(newValue);
  }, [selectedVerbs, maxSelections, mode, handleVerbSelect]);

  // Display value formatting
  const displayValue = useMemo(() => {
    if (selectedVerbs.length === 0) {
      return placeholder || 'Select HTTP verb(s)';
    }
    return formatVerbDisplay(selectedVerbs, selectedVerbs.length > 2 ? 'long' : 'short');
  }, [selectedVerbs, placeholder]);

  // Size-based styling
  const sizeClasses = {
    sm: {
      button: 'py-1.5 pl-3 pr-8 text-sm',
      icon: 'h-4 w-4',
      option: 'py-1.5 pl-2 pr-8 text-sm'
    },
    md: {
      button: 'py-2 pl-3 pr-10 text-sm',
      icon: 'h-5 w-5', 
      option: 'py-2 pl-3 pr-9 text-sm'
    },
    lg: {
      button: 'py-2.5 pl-4 pr-12 text-base',
      icon: 'h-6 w-6',
      option: 'py-2.5 pl-4 pr-10 text-base'
    }
  };

  const currentSizeClasses = sizeClasses[size];

  // Button styling based on state and theme
  const buttonClasses = cn(
    "relative w-full cursor-default rounded-md border bg-white text-left shadow-sm",
    "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
    "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
    currentSizeClasses.button,
    hasError
      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 dark:border-gray-600",
    effectiveTheme === 'dark'
      ? "bg-gray-800 text-gray-100 border-gray-600"
      : "bg-white text-gray-900 border-gray-300",
    disabled && "opacity-50",
    className
  );

  // Schema-based tooltip content
  const tooltipText = useMemo(() => {
    if (tooltipContent) return tooltipContent;
    if (schema?.description) return schema.description;
    return null;
  }, [tooltipContent, schema?.description]);

  // Label and field information
  const fieldLabel = schema?.label || schema?.name || name || 'HTTP Verbs';

  return (
    <div className="w-full" data-testid={testId}>
      {/* Field Label */}
      {showLabel && (
        <div className="flex items-center gap-2 mb-1">
          <label
            id={labelId}
            htmlFor={id}
            className={cn(
              "block text-sm font-medium",
              effectiveTheme === 'dark' ? "text-gray-200" : "text-gray-700",
              hasError && "text-red-600 dark:text-red-400"
            )}
          >
            {fieldLabel}
            {required && (
              <span className="ml-1 text-red-500" aria-label="required">
                *
              </span>
            )}
          </label>
          
          {/* Tooltip */}
          {showTooltip && tooltipText && (
            <Tooltip content={tooltipText}>
              <QuestionMarkCircleIcon 
                className={cn(
                  "h-4 w-4 cursor-help",
                  effectiveTheme === 'dark' ? "text-gray-400" : "text-gray-500"
                )}
                aria-label="Field information"
              />
            </Tooltip>
          )}
        </div>
      )}

      {/* Main Listbox Component */}
      <Listbox
        value={currentValue}
        onChange={handleVerbSelect}
        disabled={disabled}
        multiple={mode === 'verb_multiple'}
      >
        {({ open }) => (
          <div className="relative">
            <Listbox.Button
              ref={ref}
              id={id}
              className={buttonClasses}
              aria-labelledby={labelId}
              aria-describedby={cn(
                helperText && descriptionId,
                hasError && errorId
              )}
              aria-invalid={hasError}
              aria-expanded={open}
              aria-haspopup="listbox"
              onFocus={onFocus}
              onBlur={onBlur}
              {...restProps}
            >
              <span className="block truncate">
                {displayValue}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon
                  className={cn(
                    currentSizeClasses.icon,
                    effectiveTheme === 'dark' ? "text-gray-400" : "text-gray-400"
                  )}
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            {/* Options Dropdown */}
            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options
                className={cn(
                  "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md",
                  "bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5",
                  "focus:outline-none",
                  effectiveTheme === 'dark'
                    ? "bg-gray-800 ring-gray-600"
                    : "bg-white ring-black ring-opacity-5",
                  currentSizeClasses.option
                )}
                role="listbox"
                aria-labelledby={labelId}
              >
                {finalVerbOptions.map((option) => {
                  const isSelected = selectedVerbs.includes(option.altValue);
                  
                  return (
                    <Listbox.Option
                      key={option.altValue}
                      value={mode === 'verb' ? option.altValue : 
                             mode === 'verb_multiple' ? option.altValue :
                             option.value}
                      disabled={disabled}
                      className={({ active }) => 
                        mode === 'verb'
                          ? "" // Headless UI handles styling for single select
                          : "cursor-pointer" // Custom styling needed for multiple select
                      }
                    >
                      {({ active }) => (
                        <div
                          onClick={() => {
                            if (mode === 'verb') {
                              handleSingleVerbSelect(option.altValue);
                            } else {
                              handleMultipleVerbToggle(option.altValue);
                            }
                          }}
                        >
                          <VerbOptionItem
                            option={option}
                            selected={isSelected}
                            active={active}
                            disabled={disabled}
                            theme={effectiveTheme}
                          />
                        </div>
                      )}
                    </Listbox.Option>
                  );
                })}
              </Listbox.Options>
            </Transition>
          </div>
        )}
      </Listbox>

      {/* Helper Text */}
      {helperText && !hasError && (
        <p
          id={descriptionId}
          className={cn(
            "mt-1 text-xs",
            effectiveTheme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}
        >
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {hasError && (
        <p
          id={errorId}
          className="mt-1 text-xs text-red-600 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      {/* Selection Summary for Multiple Mode */}
      {mode !== 'verb' && selectedVerbs.length > 0 && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {selectedVerbs.length} verb{selectedVerbs.length !== 1 ? 's' : ''} selected
          {mode === 'number' && ` (bitmask: ${
            selectedVerbs.reduce((bitmask, verb) => {
              const verbBitmasks = { GET: 1, POST: 2, PUT: 4, PATCH: 8, DELETE: 16 };
              return bitmask | (verbBitmasks[verb] || 0);
            }, 0)
          })`}
        </div>
      )}
    </div>
  );
});

VerbPicker.displayName = 'VerbPicker';

export default VerbPicker;
export type { VerbPickerProps, HttpVerb, VerbPickerMode, VerbPickerAnyValue };