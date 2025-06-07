/**
 * Input Component Type Definitions for DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript interfaces for React 19/Next.js 15.1 input components
 * with React Hook Form integration, Zod schema validation, WCAG 2.1 AA accessibility
 * compliance, and Tailwind CSS 4.1+ styling support.
 * 
 * Features:
 * - Real-time validation under 100ms performance requirements
 * - Complete WCAG 2.1 AA accessibility compliance
 * - Responsive sizing for all screen breakpoints
 * - Dark/light theme support with proper contrast ratios
 * - React Hook Form and Zod integration for type safety
 * - Class-variance-authority for dynamic styling
 * - Advanced input masking and formatting
 * - Touch-friendly design with 44px minimum target sizes
 * 
 * @fileoverview Input component type definitions
 * @version 1.0.0
 * @since React 19 / Next.js 15.1
 */

import { 
  type ReactNode, 
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type FocusEvent,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type Ref,
  type MutableRefObject
} from 'react';

import {
  type UseFormReturn,
  type FieldError,
  type FieldValues,
  type Path,
  type PathValue,
  type Control,
  type RegisterOptions,
  type FieldPath,
  type UseFormRegisterReturn
} from 'react-hook-form';

import { type VariantProps } from 'class-variance-authority';
import { type ZodSchema, type ZodType } from 'zod';

// Import base UI and form types for consistency
import {
  type BaseComponent,
  type ComponentVariant,
  type ComponentSize,
  type ComponentState,
  type ResponsiveValue,
  type AccessibilityProps,
  type ThemeProps,
  type FocusProps,
  type ResponsiveProps,
  type AnimationProps,
  type ValidationState,
  type LoadingState,
  type FormFieldComponent,
  type FieldValidationRules
} from '../../../types/ui';

import {
  type FormFieldProps,
  type FormFieldType,
  type FormFieldVariant,
  type FormValidationResult,
  type FormState,
  type FormFieldConfig,
  type FormAccessibilityConfig,
  type FormPerformanceConfig
} from '../form/form.types';

// ============================================================================
// CORE INPUT COMPONENT TYPES
// ============================================================================

/**
 * Input component variants for consistent styling across the design system
 * Integrates with Tailwind CSS 4.1+ and class-variance-authority
 */
export type InputVariant = 
  | 'default'      // Standard outlined input
  | 'filled'       // Filled background input  
  | 'ghost'        // Minimal borderless input
  | 'underlined'   // Bottom border only
  | 'floating'     // Floating label input
  | 'inline';      // Inline form input

/**
 * Input size variants supporting WCAG 2.1 AA touch target requirements
 * Minimum 44x44px interactive area for accessibility compliance
 */
export type InputSize = 
  | 'xs'    // 36px height (use sparingly, ensure 44px touch target)
  | 'sm'    // 40px height 
  | 'md'    // 44px height (recommended minimum)
  | 'lg'    // 48px height
  | 'xl';   // 56px height

/**
 * Input state variants for visual feedback and accessibility
 * Supports WCAG 2.1 AA contrast requirements (4.5:1 normal text, 3:1 UI components)
 */
export type InputState = 
  | 'idle'       // Default state
  | 'focused'    // User is interacting
  | 'valid'      // Validation passed
  | 'invalid'    // Validation failed
  | 'warning'    // Validation warning
  | 'disabled'   // Not interactive
  | 'readonly'   // Display only
  | 'loading';   // Processing state

/**
 * Input field types supporting comprehensive database configuration scenarios
 * Extends HTML5 input types with custom DreamFactory-specific types
 */
export type InputFieldType = 
  | 'text'           // Standard text input
  | 'password'       // Password with visibility toggle
  | 'email'          // Email with validation
  | 'url'            // URL with validation
  | 'tel'            // Telephone number
  | 'number'         // Numeric input with controls
  | 'search'         // Search input with clear button
  | 'date'           // Date picker
  | 'datetime-local' // Date and time picker
  | 'time'           // Time picker
  | 'month'          // Month picker
  | 'week'           // Week picker
  | 'color'          // Color picker
  | 'range'          // Slider input
  | 'file'           // File upload
  | 'textarea'       // Multi-line text
  | 'select'         // Single selection dropdown
  | 'multiselect'    // Multiple selection dropdown
  | 'checkbox'       // Boolean checkbox
  | 'radio'          // Radio button group
  | 'switch'         // Toggle switch
  | 'hidden'         // Hidden form field
  // DreamFactory-specific types
  | 'connection-string' // Database connection string
  | 'json'           // JSON editor
  | 'sql'            // SQL query editor
  | 'expression'     // Expression builder
  | 'duration'       // Time duration
  | 'port'           // Network port number
  | 'hostname'       // Server hostname
  | 'path'           // File/directory path
  | 'tags';          // Tag selection input

/**
 * Input masking patterns for formatted input types
 * Supports common database configuration formats
 */
export type InputMask = 
  | 'phone'          // (123) 456-7890
  | 'ssn'            // 123-45-6789
  | 'credit-card'    // 1234 5678 9012 3456
  | 'date'           // MM/DD/YYYY
  | 'time'           // HH:MM AM/PM
  | 'currency'       // $1,234.56
  | 'percentage'     // 12.34%
  | 'ip-address'     // 192.168.1.1
  | 'mac-address'    // AA:BB:CC:DD:EE:FF
  | 'port-number'    // 1-65535
  | 'database-name'  // Alphanumeric with underscores
  | 'table-name'     // Database identifier format
  | 'connection-string' // Database connection format
  | string;          // Custom regex pattern

/**
 * Responsive input configuration for different screen sizes
 * Follows Tailwind CSS breakpoint system (xs, sm, md, lg, xl, 2xl)
 */
export interface ResponsiveInputConfig {
  /** Size variant per breakpoint */
  size?: ResponsiveValue<InputSize>;
  
  /** Layout orientation per breakpoint */
  orientation?: ResponsiveValue<'horizontal' | 'vertical'>;
  
  /** Label position per breakpoint */
  labelPosition?: ResponsiveValue<'top' | 'left' | 'floating' | 'inside'>;
  
  /** Full width behavior per breakpoint */
  fullWidth?: ResponsiveValue<boolean>;
  
  /** Grid column span per breakpoint */
  colSpan?: ResponsiveValue<number>;
}

// ============================================================================
// BASE INPUT PROPS INTERFACE
// ============================================================================

/**
 * Base input component props extending HTML input attributes
 * Provides foundation for all input component variations
 */
export interface BaseInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'children'>,
    AccessibilityProps,
    ThemeProps,
    FocusProps,
    ResponsiveProps,
    AnimationProps {
  
  // ========================================
  // Core Configuration
  // ========================================
  
  /** Input field type */
  type?: InputFieldType;
  
  /** Visual variant for styling */
  variant?: InputVariant;
  
  /** Size variant for responsive design */
  size?: InputSize;
  
  /** Current validation/interaction state */
  state?: InputState;
  
  /** Field name for form registration */
  name?: Path<TFieldValues>;
  
  /** Field label text */
  label?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Help text description */
  description?: string;
  
  /** Error message text */
  error?: string;
  
  /** Success message text */
  success?: string;
  
  /** Warning message text */
  warning?: string;
  
  /** Hint text for additional guidance */
  hint?: string;
  
  // ========================================
  // Styling and Layout
  // ========================================
  
  /** Custom CSS classes */
  className?: string;
  
  /** Full width behavior */
  fullWidth?: boolean;
  
  /** Responsive configuration */
  responsive?: ResponsiveInputConfig;
  
  /** Input container styling */
  containerClassName?: string;
  
  /** Label styling */
  labelClassName?: string;
  
  /** Error message styling */
  errorClassName?: string;
  
  /** Help text styling */
  descriptionClassName?: string;
  
  // ========================================
  // Icons and Adornments
  // ========================================
  
  /** Left icon component */
  leftIcon?: ReactNode;
  
  /** Right icon component */
  rightIcon?: ReactNode;
  
  /** Left adornment (text/component) */
  leftAdornment?: ReactNode;
  
  /** Right adornment (text/component) */
  rightAdornment?: ReactNode;
  
  /** Show/hide password visibility toggle */
  showPasswordToggle?: boolean;
  
  /** Show clear button for text inputs */
  showClearButton?: boolean;
  
  // ========================================
  // Validation and Formatting
  // ========================================
  
  /** Input masking configuration */
  mask?: InputMask;
  
  /** Custom format function */
  format?: (value: string) => string;
  
  /** Custom parse function */
  parse?: (value: string) => any;
  
  /** Debounce delay for onChange events (ms) */
  debounceMs?: number;
  
  /** Real-time validation function */
  validate?: (value: any) => string | boolean | Promise<string | boolean>;
  
  /** Async validation debounce delay (ms) */
  asyncValidationDebounce?: number;
  
  // ========================================
  // Behavior Configuration
  // ========================================
  
  /** Auto-focus on mount */
  autoFocus?: boolean;
  
  /** Auto-complete configuration */
  autoComplete?: string;
  
  /** Auto-correct behavior (mobile) */
  autoCorrect?: 'on' | 'off';
  
  /** Auto-capitalize behavior (mobile) */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  
  /** Spell check behavior */
  spellCheck?: boolean;
  
  /** Input mode hint for virtual keyboards */
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  
  /** Loading state indicator */
  loading?: boolean;
  
  /** Loading text for screen readers */
  loadingText?: string;
  
  // ========================================
  // Event Handlers
  // ========================================
  
  /** Value change handler */
  onChange?: (value: any, event?: ChangeEvent<HTMLInputElement>) => void;
  
  /** Blur event handler */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  
  /** Focus event handler */
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  
  /** Key press handler */
  onKeyPress?: (event: KeyboardEvent<HTMLInputElement>) => void;
  
  /** Key down handler */
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  
  /** Key up handler */
  onKeyUp?: (event: KeyboardEvent<HTMLInputElement>) => void;
  
  /** Clear button click handler */
  onClear?: () => void;
  
  /** Icon click handler */
  onIconClick?: (icon: 'left' | 'right', event: MouseEvent) => void;
  
  // ========================================
  // Accessibility Enhancements
  // ========================================
  
  /** ARIA label override */
  'aria-label'?: string;
  
  /** ARIA described by reference */
  'aria-describedby'?: string;
  
  /** ARIA labelled by reference */
  'aria-labelledby'?: string;
  
  /** ARIA required state */
  'aria-required'?: boolean;
  
  /** ARIA invalid state */
  'aria-invalid'?: boolean;
  
  /** ARIA expanded state (for selects) */
  'aria-expanded'?: boolean;
  
  /** ARIA controls reference */
  'aria-controls'?: string;
  
  /** ARIA active descendant */
  'aria-activedescendant'?: string;
  
  /** Screen reader announcement on value change */
  announceChanges?: boolean;
  
  /** Custom screen reader announcement */
  srOnlyDescription?: string;
  
  // ========================================
  // Testing and Development
  // ========================================
  
  /** Test identifier */
  'data-testid'?: string;
  
  /** Development mode configuration */
  devMode?: {
    showValidationTiming?: boolean;
    logStateChanges?: boolean;
    highlightFocusManagement?: boolean;
  };
}

// ============================================================================
// REACT HOOK FORM INTEGRATION
// ============================================================================

/**
 * React Hook Form integration props for type-safe form management
 * Supports Zod schema validation with performance optimization
 */
export interface InputFormIntegrationProps<TFieldValues extends FieldValues = FieldValues> {
  /** React Hook Form control instance */
  control?: Control<TFieldValues>;
  
  /** Field registration return value */
  register?: UseFormRegisterReturn;
  
  /** Field validation rules */
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  
  /** Form field error state */
  fieldError?: FieldError;
  
  /** Field is dirty (modified from default) */
  isDirty?: boolean;
  
  /** Field is touched (user has interacted) */
  isTouched?: boolean;
  
  /** Field is currently validating */
  isValidating?: boolean;
  
  /** Zod schema for field validation */
  schema?: ZodSchema;
  
  /** Transform value before validation */
  transform?: (value: any) => any;
  
  /** Custom error message mapping */
  errorMap?: Record<string, string>;
  
  /** Trigger validation on specific events */
  validateOn?: Array<'change' | 'blur' | 'submit'>;
  
  /** Validation debounce strategy */
  validationDebounce?: {
    onChange?: number;
    onBlur?: number;
  };
}

/**
 * Form field configuration for dynamic form generation
 * Extends base form field config with input-specific properties
 */
export interface InputFieldConfig<TFieldValues extends FieldValues = FieldValues>
  extends FormFieldConfig<TFieldValues> {
  
  /** Input-specific type */
  inputType?: InputFieldType;
  
  /** Input variant */
  variant?: InputVariant;
  
  /** Input size */
  size?: InputSize;
  
  /** Input masking */
  mask?: InputMask;
  
  /** Responsive configuration */
  responsive?: ResponsiveInputConfig;
  
  /** Icon configuration */
  icons?: {
    left?: ReactNode;
    right?: ReactNode;
  };
  
  /** Adornment configuration */
  adornments?: {
    left?: ReactNode;
    right?: ReactNode;
  };
  
  /** Input-specific validation */
  inputValidation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | boolean;
  };
  
  /** Performance configuration */
  performance?: {
    debounceMs?: number;
    asyncValidationDebounce?: number;
    enableRealTimeValidation?: boolean;
  };
}

// ============================================================================
// SPECIFIC INPUT COMPONENT INTERFACES
// ============================================================================

/**
 * Text input component props
 * Standard text input with enhanced features
 */
export interface TextInputProps<TFieldValues extends FieldValues = FieldValues> 
  extends BaseInputProps<TFieldValues>, InputFormIntegrationProps<TFieldValues> {
  
  type?: 'text' | 'email' | 'url' | 'tel' | 'search';
  
  /** Minimum character length */
  minLength?: number;
  
  /** Maximum character length */
  maxLength?: number;
  
  /** Show character counter */
  showCharacterCount?: boolean;
  
  /** Text transformation */
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  
  /** Input pattern for validation */
  pattern?: string | RegExp;
  
  /** Suggestions for autocomplete */
  suggestions?: string[];
  
  /** Show suggestions dropdown */
  showSuggestions?: boolean;
}

/**
 * Password input component props
 * Secure password input with visibility toggle and strength indicator
 */
export interface PasswordInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<TextInputProps<TFieldValues>, 'type'> {
  
  type: 'password';
  
  /** Show password strength indicator */
  showStrengthIndicator?: boolean;
  
  /** Password strength calculation function */
  calculateStrength?: (password: string) => {
    score: number;
    feedback: string[];
    level: 'weak' | 'fair' | 'good' | 'strong';
  };
  
  /** Show password requirements */
  showRequirements?: boolean;
  
  /** Password requirements configuration */
  requirements?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    forbidCommonPasswords?: boolean;
  };
  
  /** Auto-generate password feature */
  allowGeneration?: boolean;
  
  /** Password generation options */
  generationOptions?: {
    length?: number;
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSymbols?: boolean;
    excludeSimilar?: boolean;
  };
}

/**
 * Number input component props
 * Numeric input with formatting and validation
 */
export interface NumberInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'number' | 'range';
  
  /** Minimum numeric value */
  min?: number;
  
  /** Maximum numeric value */
  max?: number;
  
  /** Step increment */
  step?: number;
  
  /** Decimal precision */
  precision?: number;
  
  /** Number formatting options */
  formatOptions?: {
    style?: 'decimal' | 'currency' | 'percent';
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  };
  
  /** Show increment/decrement controls */
  showControls?: boolean;
  
  /** Allow decimal values */
  allowDecimals?: boolean;
  
  /** Allow negative values */
  allowNegative?: boolean;
  
  /** Prefix text (e.g., currency symbol) */
  prefix?: string;
  
  /** Suffix text (e.g., unit) */
  suffix?: string;
}

/**
 * Select input component props
 * Single and multi-select dropdown with search and creation
 */
export interface SelectInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'select' | 'multiselect';
  
  /** Select options */
  options: SelectOption[];
  
  /** Allow multiple selection */
  multiple?: boolean;
  
  /** Enable search/filter */
  searchable?: boolean;
  
  /** Allow creating new options */
  creatable?: boolean;
  
  /** Clear all selected options */
  clearable?: boolean;
  
  /** Close on selection (single select) */
  closeOnSelect?: boolean;
  
  /** Maximum selections (multiselect) */
  maxSelections?: number;
  
  /** Placeholder for search input */
  searchPlaceholder?: string;
  
  /** Empty state message */
  emptyMessage?: string;
  
  /** Loading state for async options */
  optionsLoading?: boolean;
  
  /** Load options asynchronously */
  loadOptions?: (searchTerm: string) => Promise<SelectOption[]>;
  
  /** Custom option renderer */
  renderOption?: (option: SelectOption, isSelected: boolean) => ReactNode;
  
  /** Custom value renderer */
  renderValue?: (value: any) => ReactNode;
  
  /** Group options by category */
  groupBy?: (option: SelectOption) => string;
  
  /** Virtual scrolling for large option lists */
  virtualized?: boolean;
  
  /** Maximum height for dropdown */
  maxDropdownHeight?: number;
  
  /** Dropdown position */
  dropdownPosition?: 'auto' | 'top' | 'bottom';
}

/**
 * Select option interface with enhanced metadata
 */
export interface SelectOption {
  /** Option value */
  value: string | number | boolean;
  
  /** Display label */
  label: string;
  
  /** Option description */
  description?: string;
  
  /** Option group */
  group?: string;
  
  /** Option is disabled */
  disabled?: boolean;
  
  /** Option icon */
  icon?: ReactNode;
  
  /** Option badge/tag */
  badge?: string;
  
  /** Custom data payload */
  data?: Record<string, any>;
  
  /** Search keywords */
  keywords?: string[];
  
  /** Option color (for visual distinction) */
  color?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Textarea input component props
 * Multi-line text input with advanced features
 */
export interface TextareaInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, 
          InputFormIntegrationProps<TFieldValues>,
          Omit<TextareaHTMLAttributes<HTMLTextareaElement>, 'onChange' | 'onBlur' | 'onFocus'> {
  
  type: 'textarea';
  
  /** Number of visible rows */
  rows?: number;
  
  /** Minimum number of rows */
  minRows?: number;
  
  /** Maximum number of rows */
  maxRows?: number;
  
  /** Auto-resize height based on content */
  autoResize?: boolean;
  
  /** Show line numbers */
  showLineNumbers?: boolean;
  
  /** Enable syntax highlighting */
  syntaxHighlighting?: boolean;
  
  /** Syntax language for highlighting */
  language?: 'sql' | 'json' | 'javascript' | 'yaml' | 'xml' | 'markdown' | 'plain';
  
  /** Code editor features */
  codeEditor?: boolean;
  
  /** Auto-format content */
  autoFormat?: boolean;
  
  /** Show word wrap toggle */
  showWordWrap?: boolean;
  
  /** Default word wrap state */
  wordWrap?: boolean;
}

/**
 * File input component props
 * File upload with drag-and-drop, progress, and validation
 */
export interface FileInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'file';
  
  /** Allow multiple file selection */
  multiple?: boolean;
  
  /** Accepted file types */
  accept?: string;
  
  /** Maximum file size (bytes) */
  maxFileSize?: number;
  
  /** Maximum number of files */
  maxFiles?: number;
  
  /** Enable drag and drop */
  dragAndDrop?: boolean;
  
  /** Show upload progress */
  showProgress?: boolean;
  
  /** Show file preview */
  showPreview?: boolean;
  
  /** Upload handler function */
  onUpload?: (files: File[]) => Promise<FileUploadResult[]>;
  
  /** File validation function */
  validateFile?: (file: File) => string | boolean;
  
  /** Custom file renderer */
  renderFile?: (file: File | FileUploadResult) => ReactNode;
  
  /** Upload progress handler */
  onProgress?: (progress: FileUploadProgress) => void;
  
  /** Upload completion handler */
  onUploadComplete?: (results: FileUploadResult[]) => void;
  
  /** File removal handler */
  onRemoveFile?: (file: File | FileUploadResult) => void;
}

/**
 * File upload result interface
 */
export interface FileUploadResult {
  /** Original file reference */
  file: File;
  
  /** Upload success status */
  success: boolean;
  
  /** Server response data */
  data?: any;
  
  /** Error message if upload failed */
  error?: string;
  
  /** Upload progress percentage */
  progress: number;
  
  /** Server file URL */
  url?: string;
  
  /** Server file ID */
  id?: string;
  
  /** Upload timestamp */
  timestamp: number;
}

/**
 * File upload progress interface
 */
export interface FileUploadProgress {
  /** File being uploaded */
  file: File;
  
  /** Upload progress percentage (0-100) */
  progress: number;
  
  /** Bytes uploaded */
  loaded: number;
  
  /** Total bytes to upload */
  total: number;
  
  /** Upload speed (bytes per second) */
  speed?: number;
  
  /** Estimated time remaining (seconds) */
  timeRemaining?: number;
}

// ============================================================================
// CHECKBOX AND RADIO COMPONENTS
// ============================================================================

/**
 * Checkbox input component props
 * Boolean and multi-value checkbox with enhanced styling
 */
export interface CheckboxInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'checkbox';
  
  /** Checkbox is checked */
  checked?: boolean;
  
  /** Indeterminate state (for parent checkboxes) */
  indeterminate?: boolean;
  
  /** Checkbox value (for multi-checkbox groups) */
  value?: string | number;
  
  /** Checkbox label position */
  labelPosition?: 'left' | 'right';
  
  /** Show checkmark animation */
  animated?: boolean;
  
  /** Custom check icon */
  checkIcon?: ReactNode;
  
  /** Custom indeterminate icon */
  indeterminateIcon?: ReactNode;
  
  /** Checkbox group configuration */
  group?: {
    name: string;
    values: Array<string | number>;
    onChange: (values: Array<string | number>) => void;
  };
}

/**
 * Radio input component props
 * Single selection radio button with group management
 */
export interface RadioInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'radio';
  
  /** Radio button value */
  value: string | number;
  
  /** Radio button is selected */
  checked?: boolean;
  
  /** Radio group name */
  groupName?: string;
  
  /** Label position */
  labelPosition?: 'left' | 'right';
  
  /** Radio button size */
  radioSize?: InputSize;
  
  /** Show selection animation */
  animated?: boolean;
  
  /** Custom selection indicator */
  indicator?: ReactNode;
  
  /** Radio group configuration */
  group?: {
    options: Array<{
      value: string | number;
      label: string;
      description?: string;
      disabled?: boolean;
    }>;
    onChange: (value: string | number) => void;
    layout?: 'vertical' | 'horizontal' | 'grid';
  };
}

/**
 * Switch/Toggle input component props
 * Boolean toggle switch with enhanced accessibility
 */
export interface SwitchInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'switch';
  
  /** Switch is enabled */
  checked?: boolean;
  
  /** Switch size variant */
  switchSize?: InputSize;
  
  /** Show on/off labels */
  showLabels?: boolean;
  
  /** Custom on label */
  onLabel?: string;
  
  /** Custom off label */
  offLabel?: string;
  
  /** Switch color when enabled */
  activeColor?: string;
  
  /** Switch color when disabled */
  inactiveColor?: string;
  
  /** Show icons in switch */
  showIcons?: boolean;
  
  /** Custom on icon */
  onIcon?: ReactNode;
  
  /** Custom off icon */
  offIcon?: ReactNode;
  
  /** Switch animation duration */
  animationDuration?: number;
  
  /** Loading state for async operations */
  switching?: boolean;
}

// ============================================================================
// SPECIALIZED INPUT COMPONENTS
// ============================================================================

/**
 * Date input component props
 * Enhanced date/time picker with timezone support
 */
export interface DateInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'date' | 'datetime-local' | 'time' | 'month' | 'week';
  
  /** Minimum selectable date */
  minDate?: Date | string;
  
  /** Maximum selectable date */
  maxDate?: Date | string;
  
  /** Disabled dates */
  disabledDates?: Date[] | ((date: Date) => boolean);
  
  /** Date format for display */
  dateFormat?: string;
  
  /** Time format for display */
  timeFormat?: string;
  
  /** Timezone for datetime inputs */
  timezone?: string;
  
  /** Show timezone selector */
  showTimezone?: boolean;
  
  /** Calendar type */
  calendarType?: 'gregorian' | 'islamic' | 'hebrew' | 'chinese';
  
  /** First day of week (0 = Sunday) */
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  
  /** Show week numbers */
  showWeekNumbers?: boolean;
  
  /** Show today button */
  showTodayButton?: boolean;
  
  /** Show clear button */
  showClearButton?: boolean;
  
  /** Inline calendar display */
  inline?: boolean;
  
  /** Month/year selection dropdowns */
  showMonthYearPickers?: boolean;
  
  /** Quick date presets */
  presets?: Array<{
    label: string;
    value: Date | (() => Date);
  }>;
}

/**
 * Color input component props
 * Color picker with palette and custom color support
 */
export interface ColorInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'color';
  
  /** Color format for value */
  format?: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';
  
  /** Show alpha channel control */
  showAlpha?: boolean;
  
  /** Color palette presets */
  palette?: string[];
  
  /** Show color palette */
  showPalette?: boolean;
  
  /** Show color picker */
  showPicker?: boolean;
  
  /** Show color input field */
  showInput?: boolean;
  
  /** Show color preview */
  showPreview?: boolean;
  
  /** Color picker size */
  pickerSize?: 'small' | 'medium' | 'large';
  
  /** Custom color validation */
  validateColor?: (color: string) => boolean;
  
  /** Recent colors memory */
  rememberRecentColors?: boolean;
  
  /** Maximum recent colors to remember */
  maxRecentColors?: number;
}

/**
 * Range/Slider input component props
 * Numeric range selection with dual handles
 */
export interface RangeInputProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<BaseInputProps<TFieldValues>, 'type'>, InputFormIntegrationProps<TFieldValues> {
  
  type: 'range';
  
  /** Minimum range value */
  min: number;
  
  /** Maximum range value */
  max: number;
  
  /** Step increment */
  step?: number;
  
  /** Current value (single handle) */
  value?: number;
  
  /** Current range values (dual handle) */
  range?: [number, number];
  
  /** Enable dual handle range */
  dualHandle?: boolean;
  
  /** Show value tooltips */
  showTooltips?: boolean;
  
  /** Show tick marks */
  showTicks?: boolean;
  
  /** Tick mark configuration */
  ticks?: Array<{
    value: number;
    label?: string;
  }>;
  
  /** Show min/max labels */
  showMinMaxLabels?: boolean;
  
  /** Value formatter for display */
  formatValue?: (value: number) => string;
  
  /** Track color gradient */
  trackGradient?: {
    from: string;
    to: string;
  };
  
  /** Vertical orientation */
  vertical?: boolean;
  
  /** Slider height (vertical mode) */
  height?: number;
}

// ============================================================================
// INPUT VALIDATION AND STATE MANAGEMENT
// ============================================================================

/**
 * Input validation configuration
 * Comprehensive validation system with performance optimization
 */
export interface InputValidationConfig {
  /** Validation rules */
  rules?: {
    required?: boolean | string;
    minLength?: number | { value: number; message: string };
    maxLength?: number | { value: number; message: string };
    min?: number | { value: number; message: string };
    max?: number | { value: number; message: string };
    pattern?: RegExp | { value: RegExp; message: string };
    validate?: Record<string, (value: any) => boolean | string>;
  };
  
  /** Validation timing */
  timing?: {
    validateOnChange?: boolean;
    validateOnBlur?: boolean;
    validateOnSubmit?: boolean;
    debounceMs?: number;
    asyncDebounceMs?: number;
  };
  
  /** Performance optimization */
  performance?: {
    enableRealTimeValidation?: boolean;
    maxValidationTime?: number;
    batchValidation?: boolean;
    cacheResults?: boolean;
  };
  
  /** Custom validation functions */
  custom?: {
    sync?: (value: any) => ValidationResult;
    async?: (value: any) => Promise<ValidationResult>;
  };
  
  /** Error message customization */
  messages?: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    min?: string;
    max?: string;
    pattern?: string;
    custom?: Record<string, string>;
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Validation is valid */
  isValid: boolean;
  
  /** Error message if invalid */
  message?: string;
  
  /** Validation warnings */
  warnings?: string[];
  
  /** Validation metadata */
  metadata?: {
    validationTime?: number;
    validator?: string;
    value?: any;
  };
}

/**
 * Input state management interface
 * Tracks all input state changes for complex forms
 */
export interface InputStateManager<TValue = any> {
  /** Current input value */
  value: TValue;
  
  /** Input is focused */
  isFocused: boolean;
  
  /** Input is dirty (modified) */
  isDirty: boolean;
  
  /** Input is touched (user interaction) */
  isTouched: boolean;
  
  /** Input is validating */
  isValidating: boolean;
  
  /** Input validation state */
  validationState: ValidationState;
  
  /** Current error message */
  error?: string;
  
  /** Current warning message */
  warning?: string;
  
  /** State change handlers */
  handlers: {
    setValue: (value: TValue) => void;
    setFocus: (focused: boolean) => void;
    setTouched: (touched: boolean) => void;
    setError: (error?: string) => void;
    setWarning: (warning?: string) => void;
    reset: () => void;
    validate: () => Promise<ValidationResult>;
  };
  
  /** State metadata */
  metadata: {
    initialValue: TValue;
    lastValidation?: Date;
    changeCount: number;
    validationCount: number;
  };
}

// ============================================================================
// INPUT STYLING AND THEMING
// ============================================================================

/**
 * Input styling configuration with theme support
 * Integrates with Tailwind CSS 4.1+ and design tokens
 */
export interface InputStylingConfig {
  /** Base styling variants */
  variants: {
    base: string;
    variant: Record<InputVariant, string>;
    size: Record<InputSize, string>;
    state: Record<InputState, string>;
  };
  
  /** Component-specific styles */
  components: {
    container: string;
    label: string;
    input: string;
    error: string;
    description: string;
    icon: string;
    adornment: string;
  };
  
  /** Focus ring configuration */
  focusRing: {
    width: string;
    color: string;
    offset: string;
    style: string;
  };
  
  /** Animation configuration */
  animations: {
    transition: string;
    duration: string;
    timing: string;
  };
  
  /** Responsive breakpoints */
  responsive: Record<string, string>;
  
  /** Dark mode overrides */
  darkMode: Record<string, string>;
  
  /** Custom CSS variables */
  cssVariables: Record<string, string>;
}

/**
 * Input theme configuration
 * Defines color schemes and styling for different themes
 */
export interface InputThemeConfig {
  /** Light theme configuration */
  light: {
    colors: {
      background: string;
      border: string;
      text: string;
      placeholder: string;
      focus: string;
      error: string;
      success: string;
      warning: string;
    };
    shadows: {
      focus: string;
      error: string;
      default: string;
    };
  };
  
  /** Dark theme configuration */
  dark: {
    colors: {
      background: string;
      border: string;
      text: string;
      placeholder: string;
      focus: string;
      error: string;
      success: string;
      warning: string;
    };
    shadows: {
      focus: string;
      error: string;
      default: string;
    };
  };
  
  /** High contrast theme */
  highContrast: {
    colors: Record<string, string>;
    shadows: Record<string, string>;
  };
  
  /** Custom theme support */
  custom?: Record<string, any>;
}

// ============================================================================
// ACCESSIBILITY AND PERFORMANCE
// ============================================================================

/**
 * Input accessibility configuration
 * Ensures WCAG 2.1 AA compliance and enhanced usability
 */
export interface InputAccessibilityConfig extends FormAccessibilityConfig {
  /** Focus management */
  focus: {
    autoFocus?: boolean;
    focusOnError?: boolean;
    trapFocus?: boolean;
    restoreFocus?: boolean;
  };
  
  /** Screen reader optimization */
  screenReader: {
    announceChanges?: boolean;
    announceValidation?: boolean;
    describedByIds?: boolean;
    labelledByIds?: boolean;
    liveRegions?: boolean;
  };
  
  /** Keyboard navigation */
  keyboard: {
    submitOnEnter?: boolean;
    clearOnEscape?: boolean;
    navigationKeys?: boolean;
    customShortcuts?: Record<string, () => void>;
  };
  
  /** Touch interaction */
  touch: {
    minTargetSize?: number;
    touchFeedback?: boolean;
    hapticFeedback?: boolean;
  };
  
  /** Visual accessibility */
  visual: {
    highContrast?: boolean;
    reducedMotion?: boolean;
    largeText?: boolean;
    colorBlindSupport?: boolean;
  };
}

/**
 * Input performance configuration
 * Optimizes input behavior for large forms and real-time validation
 */
export interface InputPerformanceConfig extends FormPerformanceConfig {
  /** Debounce configuration */
  debounce: {
    onChange?: number;
    onBlur?: number;
    validation?: number;
    asyncValidation?: number;
  };
  
  /** Rendering optimization */
  rendering: {
    virtualizeOptions?: boolean;
    lazyLoadIcons?: boolean;
    memoizeComponents?: boolean;
    batchStateUpdates?: boolean;
  };
  
  /** Validation optimization */
  validation: {
    cacheResults?: boolean;
    batchValidation?: boolean;
    maxConcurrentValidations?: number;
    timeoutMs?: number;
  };
  
  /** Memory management */
  memory: {
    cleanupOnUnmount?: boolean;
    limitHistorySize?: number;
    garbageCollectInterval?: number;
  };
}

// ============================================================================
// COMPONENT REF AND IMPERATIVE API
// ============================================================================

/**
 * Input component imperative API
 * Provides programmatic control over input components
 */
export interface InputImperativeAPI {
  /** Focus the input */
  focus: () => void;
  
  /** Blur the input */
  blur: () => void;
  
  /** Select all text */
  selectAll: () => void;
  
  /** Select text range */
  setSelectionRange: (start: number, end: number) => void;
  
  /** Get current value */
  getValue: () => any;
  
  /** Set value programmatically */
  setValue: (value: any) => void;
  
  /** Clear input value */
  clear: () => void;
  
  /** Reset to initial value */
  reset: () => void;
  
  /** Trigger validation */
  validate: () => Promise<ValidationResult>;
  
  /** Check if input is valid */
  isValid: () => boolean;
  
  /** Get validation errors */
  getErrors: () => string[];
  
  /** Scroll into view */
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
  
  /** Get input element reference */
  getElement: () => HTMLElement | null;
}

/**
 * Input component ref type
 * Forward ref type for input components
 */
export type InputRef = Ref<InputImperativeAPI>;

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Extract input props based on input type
 * Utility type for type-safe input prop extraction
 */
export type InputPropsForType<T extends InputFieldType> = 
  T extends 'text' | 'email' | 'url' | 'tel' | 'search' ? TextInputProps :
  T extends 'password' ? PasswordInputProps :
  T extends 'number' | 'range' ? NumberInputProps :
  T extends 'select' | 'multiselect' ? SelectInputProps :
  T extends 'textarea' ? TextareaInputProps :
  T extends 'file' ? FileInputProps :
  T extends 'checkbox' ? CheckboxInputProps :
  T extends 'radio' ? RadioInputProps :
  T extends 'switch' ? SwitchInputProps :
  T extends 'date' | 'datetime-local' | 'time' | 'month' | 'week' ? DateInputProps :
  T extends 'color' ? ColorInputProps :
  BaseInputProps;

/**
 * Input component factory type
 * Type for creating input components dynamically
 */
export type InputComponentFactory = <T extends InputFieldType>(
  type: T
) => ForwardRefExoticComponent<InputPropsForType<T> & RefAttributes<InputImperativeAPI>>;

/**
 * Input value type based on input type
 * Utility type for determining value type from input type
 */
export type InputValueType<T extends InputFieldType> =
  T extends 'number' | 'range' ? number :
  T extends 'checkbox' | 'switch' ? boolean :
  T extends 'multiselect' ? Array<string | number> :
  T extends 'file' ? File[] :
  T extends 'date' | 'datetime-local' | 'time' | 'month' | 'week' ? Date :
  T extends 'color' ? string :
  string;

/**
 * Default input configuration
 * Provides sensible defaults for all input components
 */
export const DEFAULT_INPUT_CONFIG = {
  /** Default size */
  size: 'md' as InputSize,
  
  /** Default variant */
  variant: 'default' as InputVariant,
  
  /** Default debounce timing */
  debounceMs: 300,
  
  /** Default async validation debounce */
  asyncValidationDebounce: 500,
  
  /** Default accessibility config */
  accessibility: {
    announceChanges: true,
    focusOnError: true,
    minTargetSize: 44,
  },
  
  /** Default performance config */
  performance: {
    enableRealTimeValidation: true,
    maxValidationTime: 100,
    cacheResults: true,
  },
  
  /** Default validation timing */
  validation: {
    validateOnBlur: true,
    validateOnChange: false,
    validateOnSubmit: true,
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Re-export React types for convenience
  ReactNode,
  ComponentPropsWithoutRef,
  ForwardRefExoticComponent,
  RefAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  
  // Re-export form types
  UseFormReturn,
  FieldError,
  FieldValues,
  Path,
  PathValue,
  Control,
  RegisterOptions,
  UseFormRegisterReturn,
  
  // Re-export validation types
  ZodSchema,
  ZodType,
  
  // Re-export styling types
  VariantProps,
};

/**
 * Main input configuration interface
 * Combines all input-related configuration into a single interface
 */
export interface InputConfig {
  /** Default input configuration */
  defaults: typeof DEFAULT_INPUT_CONFIG;
  
  /** Styling configuration */
  styling: InputStylingConfig;
  
  /** Theme configuration */
  theme: InputThemeConfig;
  
  /** Accessibility configuration */
  accessibility: InputAccessibilityConfig;
  
  /** Performance configuration */
  performance: InputPerformanceConfig;
  
  /** Validation configuration */
  validation: InputValidationConfig;
}