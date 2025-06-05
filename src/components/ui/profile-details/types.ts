/**
 * @fileoverview TypeScript type definitions for the ProfileDetails component
 * Provides comprehensive interfaces for component props, form data structure, 
 * validation schemas, and error handling with React Hook Form and Zod integration.
 * 
 * @version 1.0.0
 * @requires TypeScript 5.8+
 * @requires React 19
 * @requires React Hook Form 7.57.0+
 * @requires Zod validation
 */

import { ComponentType, ReactNode } from 'react';
import { UseFormReturn, FieldErrors, FieldValues } from 'react-hook-form';
import { z } from 'zod';

// ============================================================================
// CORE COMPONENT INTERFACES
// ============================================================================

/**
 * ProfileDetailsProps interface defining the complete component API
 * Supports optional callbacks, validation configuration, and theme integration
 */
export interface ProfileDetailsProps {
  /** Initial form data - matches Angular profileDetailsGroup structure */
  initialData?: Partial<ProfileDetailsFormData>;
  
  /** Form submission callback with typed data */
  onSubmit?: (data: ProfileDetailsFormData) => Promise<void> | void;
  
  /** Form validation callback for custom business rules */
  onValidate?: (data: ProfileDetailsFormData) => ValidationErrors | null;
  
  /** Change handler for real-time form updates */
  onChange?: (data: Partial<ProfileDetailsFormData>) => void;
  
  /** Cancel/reset callback */
  onCancel?: () => void;
  
  /** Error callback for submission failures */
  onError?: (error: Error | ValidationErrors) => void;
  
  /** Loading state indicator */
  isLoading?: boolean;
  
  /** Read-only mode flag */
  readOnly?: boolean;
  
  /** Form validation mode - defaults to 'onSubmit' */
  validationMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /** Re-validation mode after initial validation */
  reValidateMode?: 'onSubmit' | 'onBlur' | 'onChange' | 'onTouched' | 'all';
  
  /** Custom validation schema override */
  validationSchema?: z.ZodSchema<ProfileDetailsFormData>;
  
  /** Field configuration for dynamic rendering */
  fieldConfig?: Partial<Record<keyof ProfileDetailsFormData, FormFieldConfig>>;
  
  /** Theme configuration */
  theme?: ThemeAwareProps;
  
  /** Accessibility configuration */
  accessibility?: AccessibilityProps;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Test identifier for testing frameworks */
  'data-testid'?: string;
}

/**
 * ProfileDetailsFormData type matching the Angular profileDetailsGroup structure
 * Provides complete compatibility with existing form validation and submission logic
 */
export interface ProfileDetailsFormData {
  /** User's login username - required field */
  username: string;
  
  /** User's email address - required with validation */
  email: string;
  
  /** User's first name - required field */
  firstName: string;
  
  /** User's last name - required field */
  lastName: string;
  
  /** User's display name (mapped from Angular 'name' field) */
  name: string;
  
  /** User's phone number - optional field */
  phone?: string;
  
  /** Additional user profile fields for extensibility */
  [key: string]: string | undefined;
}

// ============================================================================
// VALIDATION AND ERROR HANDLING
// ============================================================================

/**
 * ValidationErrors type for comprehensive form validation
 * Supports internationalized error messages and field-specific errors
 */
export interface ValidationErrors {
  /** Field-specific validation errors */
  fieldErrors?: Partial<Record<keyof ProfileDetailsFormData, string | string[]>>;
  
  /** Global form-level validation errors */
  formErrors?: string[];
  
  /** Server-side validation errors */
  serverErrors?: string[];
  
  /** Network or system errors */
  systemErrors?: string[];
  
  /** Validation error code for i18n lookup */
  errorCode?: string;
  
  /** Detailed error context for debugging */
  errorDetails?: Record<string, unknown>;
}

/**
 * Form field configuration interface for dynamic field rendering
 * Supports conditional display, validation, and accessibility features
 */
export interface FormFieldConfig {
  /** Field display label */
  label: string;
  
  /** Field placeholder text */
  placeholder?: string;
  
  /** Field help text or description */
  helpText?: string;
  
  /** Whether field is required */
  required?: boolean;
  
  /** Whether field is disabled */
  disabled?: boolean;
  
  /** Whether field is read-only */
  readOnly?: boolean;
  
  /** Whether field is hidden */
  hidden?: boolean;
  
  /** Field input type */
  type?: 'text' | 'email' | 'tel' | 'password' | 'url';
  
  /** Auto-complete attribute value */
  autoComplete?: string;
  
  /** Maximum character length */
  maxLength?: number;
  
  /** Minimum character length */
  minLength?: number;
  
  /** Input pattern for validation */
  pattern?: string;
  
  /** Custom validation function */
  customValidator?: (value: string) => string | null;
  
  /** Conditional display logic */
  conditional?: ConditionalLogic;
  
  /** Field accessibility configuration */
  accessibility?: FieldAccessibilityConfig;
  
  /** Field-specific theme overrides */
  theme?: FieldThemeConfig;
}

/**
 * Conditional field display logic
 */
export interface ConditionalLogic {
  /** Fields to watch for changes */
  dependsOn: (keyof ProfileDetailsFormData)[];
  
  /** Condition evaluation function */
  condition: (values: Partial<ProfileDetailsFormData>) => boolean;
  
  /** Action to take when condition is met */
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
}

// ============================================================================
// THEME INTEGRATION
// ============================================================================

/**
 * ThemeAwareProps interface for consistent theme integration
 * Integrates with Zustand state management for global theme consistency
 */
export interface ThemeAwareProps {
  /** Theme variant */
  variant?: 'default' | 'compact' | 'spacious' | 'minimal';
  
  /** Color scheme */
  colorScheme?: 'light' | 'dark' | 'auto';
  
  /** Size configuration */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Border style */
  borderStyle?: 'none' | 'subtle' | 'normal' | 'bold';
  
  /** Corner radius */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Shadow intensity */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Animation preferences */
  animations?: 'none' | 'reduced' | 'normal' | 'enhanced';
  
  /** Custom CSS variable overrides */
  cssVariables?: Record<string, string>;
  
  /** Responsive breakpoint overrides */
  responsive?: ResponsiveThemeConfig;
}

/**
 * Responsive theme configuration
 */
export interface ResponsiveThemeConfig {
  /** Mobile theme overrides */
  mobile?: Partial<ThemeAwareProps>;
  
  /** Tablet theme overrides */
  tablet?: Partial<ThemeAwareProps>;
  
  /** Desktop theme overrides */
  desktop?: Partial<ThemeAwareProps>;
}

/**
 * Field-specific theme configuration
 */
export interface FieldThemeConfig {
  /** Input field styling */
  input?: {
    variant?: 'outline' | 'filled' | 'underline' | 'ghost';
    focusColor?: string;
    errorColor?: string;
    backgroundColor?: string;
  };
  
  /** Label styling */
  label?: {
    position?: 'top' | 'left' | 'floating';
    weight?: 'normal' | 'medium' | 'semibold' | 'bold';
    color?: string;
  };
  
  /** Error message styling */
  error?: {
    position?: 'bottom' | 'inline' | 'tooltip';
    animation?: 'none' | 'fade' | 'slide' | 'bounce';
  };
}

// ============================================================================
// ACCESSIBILITY SUPPORT
// ============================================================================

/**
 * AccessibilityProps for WCAG 2.1 AA compliance
 * Ensures proper ARIA attributes and keyboard navigation support
 */
export interface AccessibilityProps {
  /** Form accessibility label */
  'aria-label'?: string;
  
  /** Form accessibility description */
  'aria-describedby'?: string;
  
  /** Form accessibility labelled by */
  'aria-labelledby'?: string;
  
  /** Live region for dynamic updates */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /** Form completion status */
  'aria-busy'?: boolean;
  
  /** Form validity status */
  'aria-invalid'?: boolean;
  
  /** Required field indicator */
  'aria-required'?: boolean;
  
  /** Auto-complete behavior */
  autoComplete?: 'on' | 'off';
  
  /** Tab navigation configuration */
  tabNavigation?: TabNavigationConfig;
  
  /** Screen reader optimization */
  screenReader?: ScreenReaderConfig;
  
  /** Keyboard shortcuts */
  keyboardShortcuts?: KeyboardShortcutConfig[];
  
  /** Focus management */
  focusManagement?: FocusManagementConfig;
  
  /** Error announcement settings */
  errorAnnouncement?: ErrorAnnouncementConfig;
}

/**
 * Field-specific accessibility configuration
 */
export interface FieldAccessibilityConfig {
  /** Field accessibility label */
  'aria-label'?: string;
  
  /** Field accessibility description */
  'aria-describedby'?: string;
  
  /** Field error announcement */
  'aria-errormessage'?: string;
  
  /** Field auto-complete type */
  autoComplete?: string;
  
  /** Field tab index override */
  tabIndex?: number;
  
  /** Field role override */
  role?: string;
}

/**
 * Tab navigation configuration
 */
export interface TabNavigationConfig {
  /** Enable tab navigation */
  enabled?: boolean;
  
  /** Skip to content link */
  skipLinks?: boolean;
  
  /** Tab order override */
  tabOrder?: number[];
  
  /** Trap focus within form */
  trapFocus?: boolean;
}

/**
 * Screen reader optimization configuration
 */
export interface ScreenReaderConfig {
  /** Announce form changes */
  announceChanges?: boolean;
  
  /** Announce validation errors */
  announceErrors?: boolean;
  
  /** Announce successful submission */
  announceSuccess?: boolean;
  
  /** Use semantic HTML structure */
  semanticStructure?: boolean;
  
  /** Provide field descriptions */
  fieldDescriptions?: boolean;
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcutConfig {
  /** Shortcut key combination */
  keys: string[];
  
  /** Shortcut description */
  description: string;
  
  /** Shortcut action */
  action: () => void;
  
  /** Enable in read-only mode */
  enableInReadOnly?: boolean;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  /** Auto-focus first field */
  autoFocusFirst?: boolean;
  
  /** Focus first error on validation */
  focusFirstError?: boolean;
  
  /** Return focus after modal close */
  returnFocus?: boolean;
  
  /** Skip disabled fields */
  skipDisabled?: boolean;
}

/**
 * Error announcement configuration
 */
export interface ErrorAnnouncementConfig {
  /** Announce immediately */
  immediate?: boolean;
  
  /** Announcement delay in milliseconds */
  delay?: number;
  
  /** Use alert role */
  useAlert?: boolean;
  
  /** Include field context */
  includeFieldContext?: boolean;
}

// ============================================================================
// FORM STATE MANAGEMENT
// ============================================================================

/**
 * Form submission state
 */
export interface FormSubmissionState {
  /** Whether form is currently submitting */
  isSubmitting: boolean;
  
  /** Whether form has been submitted */
  isSubmitted: boolean;
  
  /** Whether submission was successful */
  isSubmitSuccessful: boolean;
  
  /** Number of submission attempts */
  submitCount: number;
  
  /** Submission timestamp */
  submittedAt?: Date;
  
  /** Last submission error */
  lastError?: Error | ValidationErrors;
}

/**
 * Form validation state
 */
export interface FormValidationState {
  /** Whether form is currently validating */
  isValidating: boolean;
  
  /** Whether form is valid */
  isValid: boolean;
  
  /** Current validation errors */
  errors: FieldErrors<ProfileDetailsFormData>;
  
  /** Touched fields */
  touchedFields: Partial<Record<keyof ProfileDetailsFormData, boolean>>;
  
  /** Dirty fields (modified from initial values) */
  dirtyFields: Partial<Record<keyof ProfileDetailsFormData, boolean>>;
  
  /** Whether form has been validated */
  isValidated: boolean;
}

/**
 * Complete form state combining React Hook Form with custom state
 */
export interface ProfileDetailsFormState extends FormSubmissionState, FormValidationState {
  /** React Hook Form instance */
  form: UseFormReturn<ProfileDetailsFormData>;
  
  /** Current form values */
  values: ProfileDetailsFormData;
  
  /** Initial form values */
  initialValues: ProfileDetailsFormData;
  
  /** Whether form has unsaved changes */
  isDirty: boolean;
  
  /** Form reset function */
  reset: (values?: Partial<ProfileDetailsFormData>) => void;
  
  /** Manual validation trigger */
  validate: () => Promise<boolean>;
  
  /** Clear all errors */
  clearErrors: () => void;
  
  /** Set specific field value */
  setValue: <K extends keyof ProfileDetailsFormData>(
    field: K,
    value: ProfileDetailsFormData[K],
    options?: { shouldValidate?: boolean; shouldDirty?: boolean }
  ) => void;
  
  /** Get specific field value */
  getValue: <K extends keyof ProfileDetailsFormData>(field: K) => ProfileDetailsFormData[K];
  
  /** Watch field changes */
  watch: <K extends keyof ProfileDetailsFormData>(
    field?: K | K[]
  ) => K extends undefined ? ProfileDetailsFormData : ProfileDetailsFormData[K];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Form field names as union type for type safety
 */
export type ProfileDetailsFieldNames = keyof ProfileDetailsFormData;

/**
 * Form field values as union type
 */
export type ProfileDetailsFieldValues = ProfileDetailsFormData[ProfileDetailsFieldNames];

/**
 * Partial form data for incremental updates
 */
export type PartialProfileDetailsFormData = Partial<ProfileDetailsFormData>;

/**
 * Required fields union type
 */
export type RequiredProfileDetailsFields = 'username' | 'email' | 'firstName' | 'lastName' | 'name';

/**
 * Optional fields union type
 */
export type OptionalProfileDetailsFields = 'phone';

/**
 * Form submit handler type
 */
export type ProfileDetailsSubmitHandler = (data: ProfileDetailsFormData) => Promise<void> | void;

/**
 * Form validation handler type
 */
export type ProfileDetailsValidationHandler = (data: ProfileDetailsFormData) => ValidationErrors | null;

/**
 * Form change handler type
 */
export type ProfileDetailsChangeHandler = (data: Partial<ProfileDetailsFormData>) => void;

/**
 * Zod schema type for profile details
 */
export type ProfileDetailsSchema = z.ZodType<ProfileDetailsFormData>;

/**
 * Theme mode type for enhanced TypeScript 5.8+ literal types
 */
export type ThemeMode = `${string}-theme` | 'auto' | 'light' | 'dark';

/**
 * Component size type with enhanced template literal types
 */
export type ComponentSize = `${'xs' | 'sm' | 'md' | 'lg' | 'xl'}${'' | '-compact' | '-spacious'}`;

/**
 * Accessibility role type
 */
export type AccessibilityRole = 'form' | 'group' | 'region' | 'dialog' | 'alert' | 'status';

/**
 * Form layout type
 */
export type FormLayout = 'vertical' | 'horizontal' | 'inline' | 'grid' | 'card';

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default form configuration
 */
export const DEFAULT_FORM_CONFIG: Required<Pick<ProfileDetailsProps, 'validationMode' | 'reValidateMode'>> = {
  validationMode: 'onSubmit',
  reValidateMode: 'onChange',
} as const;

/**
 * Default theme configuration
 */
export const DEFAULT_THEME_CONFIG: Required<ThemeAwareProps> = {
  variant: 'default',
  colorScheme: 'auto',
  size: 'md',
  borderStyle: 'normal',
  borderRadius: 'md',
  shadow: 'sm',
  animations: 'normal',
  cssVariables: {},
  responsive: {},
} as const;

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY_CONFIG: Required<AccessibilityProps> = {
  'aria-label': 'Profile Details Form',
  'aria-describedby': '',
  'aria-labelledby': '',
  'aria-live': 'polite',
  'aria-busy': false,
  'aria-invalid': false,
  'aria-required': false,
  autoComplete: 'on',
  tabNavigation: {
    enabled: true,
    skipLinks: true,
    tabOrder: [],
    trapFocus: false,
  },
  screenReader: {
    announceChanges: true,
    announceErrors: true,
    announceSuccess: true,
    semanticStructure: true,
    fieldDescriptions: true,
  },
  keyboardShortcuts: [],
  focusManagement: {
    autoFocusFirst: false,
    focusFirstError: true,
    returnFocus: true,
    skipDisabled: true,
  },
  errorAnnouncement: {
    immediate: false,
    delay: 100,
    useAlert: true,
    includeFieldContext: true,
  },
} as const;

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if value is valid ProfileDetailsFormData
 */
export function isProfileDetailsFormData(value: unknown): value is ProfileDetailsFormData {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).username === 'string' &&
    typeof (value as any).email === 'string' &&
    typeof (value as any).firstName === 'string' &&
    typeof (value as any).lastName === 'string' &&
    typeof (value as any).name === 'string'
  );
}

/**
 * Type guard to check if value is ValidationErrors
 */
export function isValidationErrors(value: unknown): value is ValidationErrors {
  return (
    typeof value === 'object' &&
    value !== null &&
    (
      'fieldErrors' in value ||
      'formErrors' in value ||
      'serverErrors' in value ||
      'systemErrors' in value
    )
  );
}

/**
 * Type guard to check if error is a ValidationErrors object
 */
export function isFormValidationError(error: Error | ValidationErrors): error is ValidationErrors {
  return isValidationErrors(error);
}