/**
 * VerbPicker Component - HTTP Verb Selection with Headless UI
 * 
 * Main React HTTP verb selection component built on Headless UI Listbox with Tailwind CSS styling.
 * Provides accessible verb selection (GET, POST, PUT, PATCH, DELETE) with single, multiple, and bitmask modes.
 * Integrates with React Hook Form for validation and includes ARIA labeling, theme support, and tooltip
 * functionality for WCAG 2.1 AA compliance.
 * 
 * @fileoverview Production-ready HTTP verb picker component with comprehensive accessibility
 * @version 1.0.0
 */

import React, { forwardRef, useState, useId, useMemo, Fragment } from 'react';
import { 
  Listbox, 
  Transition,
  Label as HeadlessLabel,
  Description as HeadlessDescription 
} from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { 
  type VerbPickerProps,
  type HttpVerb,
  type VerbOption,
  type VerbPickerMode,
  type VerbPickerValue,
  DEFAULT_VERB_OPTIONS,
  type VerbColorVariant
} from './types';
import { 
  useVerbPickerComplete,
  useVerbOptions,
  useThemeMode 
} from './hooks';
import {
  getSelectedVerbs,
  isVerbSelected,
  formatVerbDisplay,
  convertVerbsToBitmask,
  convertBitmaskToVerbs,
  convertVerbToBitmask
} from './utils';

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

/**
 * Verb color variants for consistent HTTP method styling
 * Provides accessible color combinations for light and dark themes
 */
const VERB_THEME_CLASSES: Record<VerbColorVariant, {
  light: { bg: string; text: string; border: string; hover: string; selected: string };
  dark: { bg: string; text: string; border: string; hover: string; selected: string };
}> = {
  get: {
    light: { 
      bg: 'bg-blue-50', 
      text: 'text-blue-700', 
      border: 'border-blue-200', 
      hover: 'hover:bg-blue-100', 
      selected: 'bg-blue-100 border-blue-300' 
    },
    dark: { 
      bg: 'bg-blue-900/20', 
      text: 'text-blue-300', 
      border: 'border-blue-700', 
      hover: 'hover:bg-blue-800/30', 
      selected: 'bg-blue-800/40 border-blue-600' 
    }
  },
  post: {
    light: { 
      bg: 'bg-green-50', 
      text: 'text-green-700', 
      border: 'border-green-200', 
      hover: 'hover:bg-green-100', 
      selected: 'bg-green-100 border-green-300' 
    },
    dark: { 
      bg: 'bg-green-900/20', 
      text: 'text-green-300', 
      border: 'border-green-700', 
      hover: 'hover:bg-green-800/30', 
      selected: 'bg-green-800/40 border-green-600' 
    }
  },
  put: {
    light: { 
      bg: 'bg-orange-50', 
      text: 'text-orange-700', 
      border: 'border-orange-200', 
      hover: 'hover:bg-orange-100', 
      selected: 'bg-orange-100 border-orange-300' 
    },
    dark: { 
      bg: 'bg-orange-900/20', 
      text: 'text-orange-300', 
      border: 'border-orange-700', 
      hover: 'hover:bg-orange-800/30', 
      selected: 'bg-orange-800/40 border-orange-600' 
    }
  },
  patch: {
    light: { 
      bg: 'bg-purple-50', 
      text: 'text-purple-700', 
      border: 'border-purple-200', 
      hover: 'hover:bg-purple-100', 
      selected: 'bg-purple-100 border-purple-300' 
    },
    dark: { 
      bg: 'bg-purple-900/20', 
      text: 'text-purple-300', 
      border: 'border-purple-700', 
      hover: 'hover:bg-purple-800/30', 
      selected: 'bg-purple-800/40 border-purple-600' 
    }
  },
  delete: {
    light: { 
      bg: 'bg-red-50', 
      text: 'text-red-700', 
      border: 'border-red-200', 
      hover: 'hover:bg-red-100', 
      selected: 'bg-red-100 border-red-300' 
    },
    dark: { 
      bg: 'bg-red-900/20', 
      text: 'text-red-300', 
      border: 'border-red-700', 
      hover: 'hover:bg-red-800/30', 
      selected: 'bg-red-800/40 border-red-600' 
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get verb color variant based on HTTP method
 */
function getVerbColorVariant(verb: HttpVerb): VerbColorVariant {
  return verb.toLowerCase() as VerbColorVariant;
}

/**
 * Get theme classes for a specific verb
 */
function getVerbThemeClasses(verb: HttpVerb, isDark: boolean, state: 'default' | 'hover' | 'selected' = 'default') {
  const variant = getVerbColorVariant(verb);
  const theme = isDark ? VERB_THEME_CLASSES[variant].dark : VERB_THEME_CLASSES[variant].light;
  
  switch (state) {
    case 'hover':
      return `${theme.bg} ${theme.text} ${theme.border} ${theme.hover}`;
    case 'selected':
      return `${theme.selected} ${theme.text}`;
    default:
      return `${theme.bg} ${theme.text} ${theme.border}`;
  }
}

/**
 * Format display value based on mode and selection
 */
function formatDisplayValue<TMode extends VerbPickerMode>(
  value: VerbPickerValue<TMode>, 
  mode: TMode,
  placeholder: string = 'Select verb(s)...'
): string {
  if (value == null) return placeholder;
  
  switch (mode) {
    case 'verb':
      return typeof value === 'string' ? value : placeholder;
    case 'verb_multiple':
      if (Array.isArray(value)) {
        return value.length === 0 ? placeholder : 
               value.length === 1 ? value[0] : 
               `${value.length} verbs selected`;
      }
      return placeholder;
    case 'number':
      if (typeof value === 'number') {
        const verbs = convertBitmaskToVerbs(value);
        return verbs.length === 0 ? placeholder :
               verbs.length === 1 ? verbs[0] :
               `${verbs.length} verbs selected`;
      }
      return placeholder;
    default:
      return placeholder;
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * VerbOption Component - Individual verb option with tooltip
 */
interface VerbOptionProps {
  option: VerbOption;
  selected: boolean;
  active: boolean;
  disabled?: boolean;
  showTooltip?: boolean;
  isDark: boolean;
  onSelect: () => void;
}

const VerbOption = React.memo<VerbOptionProps>(({ 
  option, 
  selected, 
  active, 
  disabled = false,
  showTooltip = true,
  isDark,
  onSelect 
}) => {
  const themeClasses = getVerbThemeClasses(
    option.altValue, 
    isDark, 
    selected ? 'selected' : active ? 'hover' : 'default'
  );

  return (
    <Listbox.Option
      value={option.altValue}
      disabled={disabled}
      className={({ active, selected: isSelected }) =>
        cn(
          // Base styles
          'relative cursor-pointer select-none py-2 pl-3 pr-9 rounded-md transition-colors duration-150',
          
          // Theme-aware styling
          selected || isSelected 
            ? getVerbThemeClasses(option.altValue, isDark, 'selected')
            : active 
            ? getVerbThemeClasses(option.altValue, isDark, 'hover')
            : getVerbThemeClasses(option.altValue, isDark, 'default'),
          
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
          
          // Focus ring for accessibility
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          isDark && 'focus:ring-offset-gray-800'
        )
      }
      title={showTooltip && option.description ? option.description : undefined}
      aria-label={option.ariaLabel || `Select ${option.label} HTTP method`}
    >
      {({ selected: isSelected }) => (
        <>
          <div className="flex items-center">
            <span className={cn(
              'block truncate font-medium text-sm',
              (selected || isSelected) ? 'font-semibold' : 'font-normal'
            )}>
              {option.label}
            </span>
            
            {option.description && showTooltip && (
              <InformationCircleIcon 
                className="ml-2 h-4 w-4 opacity-60" 
                aria-hidden="true"
              />
            )}
          </div>
          
          {(selected || isSelected) && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <CheckIcon 
                className="h-4 w-4 text-current" 
                aria-hidden="true" 
              />
            </span>
          )}
        </>
      )}
    </Listbox.Option>
  );
});

VerbOption.displayName = 'VerbOption';

/**
 * SelectedVerbBadge Component - Display badge for selected verbs in multiple mode
 */
interface SelectedVerbBadgeProps {
  verb: HttpVerb;
  isDark: boolean;
  onRemove?: () => void;
  removable?: boolean;
}

const SelectedVerbBadge = React.memo<SelectedVerbBadgeProps>(({ 
  verb, 
  isDark, 
  onRemove, 
  removable = false 
}) => {
  const themeClasses = getVerbThemeClasses(verb, isDark, 'selected');
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border',
      themeClasses,
      'transition-colors duration-150'
    )}>
      {verb}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className={cn(
            'ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-black/10',
            'focus:outline-none focus:ring-1 focus:ring-current',
            isDark && 'hover:bg-white/10'
          )}
          aria-label={`Remove ${verb}`}
        >
          <XMarkIcon className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
});

SelectedVerbBadge.displayName = 'SelectedVerbBadge';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * VerbPicker Component
 * 
 * Comprehensive HTTP verb selection component with accessibility, validation, and theme support
 */
const VerbPicker = forwardRef<
  HTMLButtonElement,
  VerbPickerProps
>(function VerbPicker({
  mode = 'verb_multiple',
  schema,
  showLabel = true,
  label,
  description,
  value,
  defaultValue,
  options = DEFAULT_VERB_OPTIONS,
  onChange,
  onBlur,
  onFocus,
  error,
  helpText,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  variant = 'outline',
  orientation = 'vertical',
  multiple = false,
  showTooltips = true,
  theme,
  transform,
  bitmaskUtils,
  className,
  containerClassName,
  labelClassName,
  'data-testid': testId = 'verb-picker',
  renderOption,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  ...rest
}, ref) {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================
  
  const componentId = useId();
  const labelId = `${componentId}-label`;
  const descriptionId = `${componentId}-description`;
  const errorId = `${componentId}-error`;
  const helpId = `${componentId}-help`;
  
  const { isDark } = useThemeMode('system', theme);
  const [isOpen, setIsOpen] = useState(false);
  
  // Normalize the value based on mode
  const normalizedValue = useMemo(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    
    // Return appropriate default for mode
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
  }, [value, defaultValue, mode]);
  
  // Get currently selected verbs
  const selectedVerbs = useMemo(() => 
    getSelectedVerbs(normalizedValue, mode),
    [normalizedValue, mode]
  );
  
  // Handle selection changes with proper type safety
  const handleSelectionChange = (newValue: any) => {
    let transformedValue: any;
    
    switch (mode) {
      case 'verb':
        transformedValue = newValue;
        break;
      case 'verb_multiple':
        transformedValue = Array.isArray(newValue) ? newValue : [newValue];
        break;
      case 'number':
        transformedValue = Array.isArray(newValue) 
          ? convertVerbsToBitmask(newValue)
          : convertVerbToBitmask(newValue);
        break;
      default:
        transformedValue = newValue;
    }
    
    onChange?.(transformedValue);
  };
  
  // Handle individual verb toggle for multiple mode
  const handleVerbToggle = (verb: HttpVerb) => {
    if (disabled || readOnly) return;
    
    switch (mode) {
      case 'verb':
        handleSelectionChange(verb);
        break;
        
      case 'verb_multiple': {
        const currentVerbs = Array.isArray(normalizedValue) ? normalizedValue : [];
        const isSelected = currentVerbs.includes(verb);
        const newVerbs = isSelected 
          ? currentVerbs.filter(v => v !== verb)
          : [...currentVerbs, verb];
        handleSelectionChange(newVerbs);
        break;
      }
      
      case 'number': {
        const currentBitmask = typeof normalizedValue === 'number' ? normalizedValue : 0;
        const verbBitmask = convertVerbToBitmask(verb);
        const isSelected = (currentBitmask & verbBitmask) === verbBitmask;
        const newBitmask = isSelected 
          ? currentBitmask & ~verbBitmask
          : currentBitmask | verbBitmask;
        handleSelectionChange(newBitmask);
        break;
      }
    }
  };
  
  // Remove specific verb (for multiple mode badges)
  const handleVerbRemove = (verb: HttpVerb) => {
    if (disabled || readOnly) return;
    
    switch (mode) {
      case 'verb_multiple': {
        const currentVerbs = Array.isArray(normalizedValue) ? normalizedValue : [];
        const newVerbs = currentVerbs.filter(v => v !== verb);
        handleSelectionChange(newVerbs);
        break;
      }
      
      case 'number': {
        const currentBitmask = typeof normalizedValue === 'number' ? normalizedValue : 0;
        const verbBitmask = convertVerbToBitmask(verb);
        const newBitmask = currentBitmask & ~verbBitmask;
        handleSelectionChange(newBitmask);
        break;
      }
    }
  };
  
  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const displayValue = formatDisplayValue(normalizedValue, mode, 'Select HTTP method(s)...');
  const hasError = Boolean(error);
  const hasSelection = selectedVerbs.length > 0;
  const isMultipleMode = mode === 'verb_multiple' || mode === 'number';
  
  // ARIA attributes
  const ariaDescriptions = [
    description && descriptionId,
    helpText && helpId,
    error && errorId,
    ariaDescribedBy
  ].filter(Boolean).join(' ') || undefined;
  
  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  
  const renderSelectedBadges = () => {
    if (!isMultipleMode || selectedVerbs.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {selectedVerbs.map((verb) => (
          <SelectedVerbBadge
            key={verb}
            verb={verb}
            isDark={isDark}
            onRemove={() => handleVerbRemove(verb)}
            removable={!disabled && !readOnly}
          />
        ))}
      </div>
    );
  };
  
  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  
  return (
    <div 
      className={cn('w-full', containerClassName)}
      data-testid={testId}
    >
      {/* Label */}
      {showLabel && label && (
        <HeadlessLabel 
          as="label"
          htmlFor={componentId}
          className={cn(
            'block text-sm font-medium mb-2',
            isDark ? 'text-gray-200' : 'text-gray-700',
            hasError && (isDark ? 'text-red-400' : 'text-red-600'),
            required && "after:content-['*'] after:ml-1 after:text-red-500",
            labelClassName
          )}
          id={labelId}
        >
          {label}
        </HeadlessLabel>
      )}
      
      {/* Description */}
      {description && (
        <HeadlessDescription
          className={cn(
            'text-sm mb-2',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
          id={descriptionId}
        >
          {description}
        </HeadlessDescription>
      )}
      
      {/* Main Listbox */}
      <Listbox
        value={mode === 'verb_multiple' ? selectedVerbs : selectedVerbs[0] || null}
        onChange={mode === 'verb_multiple' ? handleSelectionChange : (value) => handleSelectionChange(value)}
        multiple={mode === 'verb_multiple'}
        disabled={disabled}
        by={(a, b) => a === b}
      >
        <div className="relative">
          {/* Trigger Button */}
          <Listbox.Button
            ref={ref}
            className={cn(
              // Base styles
              'relative w-full cursor-pointer rounded-lg border py-2 pl-3 pr-10 text-left transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              
              // Size variants
              size === 'xs' && 'py-1 px-2 text-xs',
              size === 'sm' && 'py-1.5 px-2.5 text-sm',
              size === 'md' && 'py-2 px-3 text-sm',
              size === 'lg' && 'py-2.5 px-3.5 text-base',
              size === 'xl' && 'py-3 px-4 text-lg',
              
              // Variant styles
              variant === 'outline' && (
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-gray-100 hover:border-gray-500' 
                  : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
              ),
              variant === 'filled' && (
                isDark 
                  ? 'border-gray-700 bg-gray-700 text-gray-100 hover:bg-gray-600' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100'
              ),
              
              // State styles
              hasError && (
                isDark 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-red-300 focus:ring-red-500'
              ),
              disabled && 'opacity-50 cursor-not-allowed',
              readOnly && 'cursor-default',
              
              // Focus ring offset
              isDark && 'focus:ring-offset-gray-800',
              
              className
            )}
            aria-label={ariaLabel || label || 'Select HTTP methods'}
            aria-describedby={ariaDescriptions}
            aria-required={ariaRequired || required}
            aria-invalid={ariaInvalid || hasError}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            id={componentId}
            onFocus={onFocus}
            onBlur={onBlur}
            data-testid={`${testId}-button`}
          >
            <span className={cn(
              'block truncate',
              !hasSelection && (isDark ? 'text-gray-400' : 'text-gray-500')
            )}>
              {displayValue}
            </span>
            
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className={cn(
                  'h-5 w-5',
                  isDark ? 'text-gray-400' : 'text-gray-400'
                )}
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          
          {/* Options Dropdown */}
          <Transition
            as={Fragment}
            show={isOpen}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            beforeEnter={() => setIsOpen(true)}
            afterLeave={() => setIsOpen(false)}
          >
            <Listbox.Options 
              className={cn(
                'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border py-1 shadow-lg',
                'focus:outline-none',
                isDark 
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-white'
              )}
              data-testid={`${testId}-options`}
            >
              {options.map((option) => {
                const isSelected = isVerbSelected(normalizedValue, option.altValue, mode);
                
                if (renderOption) {
                  return (
                    <Fragment key={option.value}>
                      {renderOption(option, isSelected)}
                    </Fragment>
                  );
                }
                
                return (
                  <VerbOption
                    key={option.value}
                    option={option}
                    selected={isSelected}
                    active={false}
                    disabled={option.disabled}
                    showTooltip={showTooltips}
                    isDark={isDark}
                    onSelect={() => handleVerbToggle(option.altValue)}
                  />
                );
              })}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {/* Selected Verbs Badges (Multiple Mode) */}
      {renderSelectedBadges()}
      
      {/* Error Message */}
      {error && (
        <div 
          className={cn(
            'mt-2 flex items-center gap-1 text-sm',
            isDark ? 'text-red-400' : 'text-red-600'
          )}
          id={errorId}
          role="alert"
          aria-live="polite"
        >
          <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      
      {/* Help Text */}
      {helpText && !error && (
        <div 
          className={cn(
            'mt-2 text-sm',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}
          id={helpId}
        >
          {helpText}
        </div>
      )}
    </div>
  );
});

VerbPicker.displayName = 'VerbPicker';

// ============================================================================
// EXPORTS
// ============================================================================

export default VerbPicker;
export { VerbPicker };
export type { VerbPickerProps };

// Export sub-components for advanced usage
export { VerbOption, SelectedVerbBadge };

// Re-export types and utilities for convenience
export type { 
  HttpVerb, 
  VerbOption as VerbOptionType, 
  VerbPickerMode,
  VerbPickerValue,
  VerbColorVariant
} from './types';

export {
  DEFAULT_VERB_OPTIONS,
  getSelectedVerbs,
  isVerbSelected,
  formatVerbDisplay,
  convertVerbsToBitmask,
  convertBitmaskToVerbs,
  convertVerbToBitmask
} from './utils';