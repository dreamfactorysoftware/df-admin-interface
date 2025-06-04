/**
 * @fileoverview TypeScript type definitions for the React user details component
 * @description Comprehensive interfaces for component props, form data structure, validation schemas,
 * and integration patterns supporting React Hook Form, Zod validation, and WCAG 2.1 AA compliance
 * @module UserDetailsTypes
 */

import { ReactNode, ComponentPropsWithoutRef, AriaAttributes } from 'react';
import { UseFormReturn, UseFieldArrayReturn, FieldValues, Path, FieldPath } from 'react-hook-form';
import { z } from 'zod';

// Re-export common types for convenience
export type {
  UseFormReturn,
  UseFieldArrayReturn,
  FieldValues,
  Path as FormPath,
  FieldPath as FormFieldPath,
} from 'react-hook-form';

// ============================================================================
// CORE ENUMS AND UNIONS
// ============================================================================

/**
 * Form operation mode for create vs edit workflows
 */
export type FormMode = 'create' | 'edit';

/**
 * User type discrimination for admin vs user workflows
 */
export type UserType = 'users' | 'admins';

/**
 * User profile type union for backward compatibility
 */
export type UserProfileType = 'users' | 'admins';

/**
 * Theme mode for consistent styling across components
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Component size variants
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Form field validation states
 */
export type ValidationState = 'valid' | 'invalid' | 'pending' | 'idle';

// ============================================================================
// ACCESSIBILITY AND INTERNATIONALIZATION
// ============================================================================

/**
 * Accessibility props interface ensuring WCAG 2.1 AA compliance
 */
export interface AccessibilityProps extends AriaAttributes {
  /** ARIA label for screen readers */
  'aria-label'?: string;
  /** ARIA labelledby reference */
  'aria-labelledby'?: string;
  /** ARIA describedby reference */
  'aria-describedby'?: string;
  /** ARIA required state */
  'aria-required'?: boolean;
  /** ARIA invalid state */
  'aria-invalid'?: boolean;
  /** ARIA expanded state for collapsible content */
  'aria-expanded'?: boolean;
  /** ARIA controls relationship */
  'aria-controls'?: string;
  /** ARIA live regions for dynamic content */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Role attribute for semantic meaning */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Keyboard event handlers */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
}

/**
 * Internationalization support for localized content
 */
export interface InternationalizationProps {
  /** Current locale */
  locale?: string;
  /** Translation namespace */
  namespace?: string;
  /** Localized text and error messages */
  translations?: {
    labels?: Record<string, string>;
    errors?: Record<string, string>;
    placeholders?: Record<string, string>;
    descriptions?: Record<string, string>;
  };
}

// ============================================================================
// THEME AND STYLING
// ============================================================================

/**
 * Theme-aware props for consistent dark/light mode support
 */
export interface ThemeAwareProps {
  /** Current theme mode */
  theme?: ThemeMode;
  /** Force dark mode */
  darkMode?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Component size */
  size?: ComponentSize;
}

/**
 * Zustand store integration for theme management
 */
export interface ThemeStoreState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// ============================================================================
// FORM DATA STRUCTURES
// ============================================================================

/**
 * Profile details form data matching Angular's reactive form structure
 */
export interface ProfileDetailsFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
}

/**
 * Tab access item for admin access control
 */
export interface TabAccessItem {
  /** Tab identifier */
  id: string;
  /** Tab display name */
  name: string;
  /** Tab label for UI */
  label: string;
  /** Whether tab is selected */
  selected: boolean;
  /** Whether tab is enabled */
  enabled: boolean;
  /** Whether tab is required */
  required?: boolean;
  /** Tab description */
  description?: string;
  /** Tab category/group */
  category?: string;
}

/**
 * Lookup key item for FormArray
 */
export interface LookupKeyItem {
  /** Lookup key name */
  name: string;
  /** Lookup key value */
  value: string;
  /** Whether key is private */
  private: boolean;
  /** Optional description */
  description?: string;
  /** Validation errors */
  errors?: Record<string, string>;
}

/**
 * App role item for FormArray
 */
export interface AppRoleItem {
  /** Application identifier */
  app: string;
  /** Role identifier */
  role: string;
  /** App display name */
  appName?: string;
  /** Role display name */
  roleName?: string;
  /** Whether assignment is active */
  active?: boolean;
  /** Validation errors */
  errors?: Record<string, string>;
}

/**
 * Complete user details form data structure matching Angular's nested reactive form
 */
export interface UserDetailsFormData {
  /** Profile details group */
  profileDetailsGroup: ProfileDetailsFormData;
  /** User active status */
  isActive: boolean;
  /** Admin access tabs */
  tabs: TabAccessItem[];
  /** User lookup keys */
  lookupKeys: LookupKeyItem[];
  /** User to app role assignments */
  appRoles: AppRoleItem[];
  /** Password for new users */
  password?: string;
  /** Password confirmation */
  confirmPassword?: string;
  /** Whether to set password */
  setPassword?: boolean;
  /** Whether to send invite */
  sendInvite?: boolean;
}

// ============================================================================
// VALIDATION AND ERROR HANDLING
// ============================================================================

/**
 * Form validation errors with internationalized messages
 */
export interface ValidationErrors {
  /** Field-level errors */
  fields?: Record<string, string | string[]>;
  /** Global form errors */
  global?: string[];
  /** Server-side validation errors */
  server?: string[];
  /** Custom validation errors */
  custom?: Record<string, string>;
}

/**
 * Zod validation schema types for runtime validation
 */
export interface ZodValidationSchemas {
  /** Profile details validation schema */
  profileDetailsSchema: z.ZodSchema<ProfileDetailsFormData>;
  /** Lookup keys validation schema */
  lookupKeysSchema: z.ZodSchema<LookupKeyItem[]>;
  /** App roles validation schema */
  appRolesSchema: z.ZodSchema<AppRoleItem[]>;
  /** Complete form validation schema */
  userDetailsSchema: z.ZodSchema<UserDetailsFormData>;
}

/**
 * Real-time validation configuration
 */
export interface ValidationConfig {
  /** Validation mode */
  mode: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
  /** Re-validation mode */
  reValidateMode: 'onSubmit' | 'onChange' | 'onBlur' | 'onTouched' | 'all';
  /** Whether to focus on first error */
  shouldFocusError: boolean;
  /** Validation delay in milliseconds */
  delayError: number;
  /** Custom validation functions */
  customValidators?: Record<string, (value: any) => boolean | string>;
}

// ============================================================================
// COMPONENT STATE AND PROPS
// ============================================================================

/**
 * Paywall state for feature restriction
 */
export interface PaywallState {
  /** Whether paywall is active */
  isActive: boolean;
  /** Restricted features */
  restrictedFeatures: string[];
  /** Paywall message */
  message?: string;
  /** Upgrade URL */
  upgradeUrl?: string;
}

/**
 * Form workflow state management
 */
export interface FormWorkflowState {
  /** Current step in workflow */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form has been submitted */
  hasSubmitted: boolean;
  /** Whether form is dirty */
  isDirty: boolean;
  /** Whether form is valid */
  isValid: boolean;
  /** Form submission progress */
  progress?: number;
}

/**
 * Event handler callbacks for parent component integration
 */
export interface FormCallbacks<T extends FieldValues = UserDetailsFormData> {
  /** Form submission handler */
  onSubmit?: (data: T) => void | Promise<void>;
  /** Form change handler */
  onChange?: (data: Partial<T>) => void;
  /** Form validation handler */
  onValidate?: (data: T) => ValidationErrors | Promise<ValidationErrors>;
  /** Form reset handler */
  onReset?: () => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Error handler */
  onError?: (error: Error | ValidationErrors) => void;
  /** Success handler */
  onSuccess?: (data: T) => void;
}

// ============================================================================
// MAIN COMPONENT PROPS
// ============================================================================

/**
 * Generic user details component props with backward compatibility
 */
export interface UserDetailsProps<
  TFormData extends FieldValues = UserDetailsFormData,
  TUserType extends UserProfileType = UserProfileType
> extends ComponentPropsWithoutRef<'form'>,
    AccessibilityProps,
    InternationalizationProps,
    ThemeAwareProps {
  
  // ========== Core Configuration ==========
  
  /** Form operation mode */
  mode: FormMode;
  /** User type for feature toggling */
  userType: TUserType;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Whether component is in loading state */
  loading?: boolean;
  /** Component test ID */
  'data-testid'?: string;

  // ========== Form Integration ==========
  
  /** React Hook Form instance */
  form?: UseFormReturn<TFormData>;
  /** Initial form data */
  defaultValues?: Partial<TFormData>;
  /** Form validation configuration */
  validation?: ValidationConfig;
  /** Zod validation schemas */
  schemas?: Partial<ZodValidationSchemas>;
  /** Event callbacks */
  callbacks?: FormCallbacks<TFormData>;

  // ========== Data and Options ==========
  
  /** Available applications for role assignment */
  apps?: Array<{
    id: string;
    name: string;
    label?: string;
    description?: string;
  }>;
  
  /** Available roles for assignment */
  roles?: Array<{
    id: string;
    name: string;
    label?: string;
    description?: string;
  }>;
  
  /** Available admin tabs for access control */
  availableTabs?: TabAccessItem[];
  
  /** Current user profile data */
  currentProfile?: Partial<TFormData>;

  // ========== Feature Configuration ==========
  
  /** Paywall state for feature restrictions */
  paywall?: PaywallState;
  /** Whether to show password fields */
  showPasswordFields?: boolean;
  /** Whether to show invite functionality */
  showInviteFeature?: boolean;
  /** Whether to show admin access controls */
  showAdminAccess?: boolean;
  /** Whether to show app role assignments */
  showAppRoles?: boolean;
  /** Whether to show lookup keys */
  showLookupKeys?: boolean;

  // ========== UI Configuration ==========
  
  /** Form layout configuration */
  layout?: {
    columns?: number;
    gap?: ComponentSize;
    responsive?: boolean;
  };
  
  /** Field visibility configuration */
  fieldVisibility?: {
    [K in keyof TFormData]?: boolean;
  };
  
  /** Custom field labels */
  fieldLabels?: {
    [K in keyof TFormData]?: string;
  };
  
  /** Custom field placeholders */
  fieldPlaceholders?: {
    [K in keyof TFormData]?: string;
  };

  // ========== Navigation and Actions ==========
  
  /** Cancel route for navigation */
  cancelRoute?: string;
  /** Custom action buttons */
  customActions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
    disabled?: boolean;
    loading?: boolean;
  }>;

  // ========== Advanced Configuration ==========
  
  /** Custom render functions for fields */
  customRenderers?: {
    [K in keyof TFormData]?: (props: {
      field: any;
      fieldState: any;
      formState: any;
    }) => ReactNode;
  };
  
  /** Conditional field logic */
  conditionalFields?: Array<{
    field: keyof TFormData;
    condition: (values: TFormData) => boolean;
    action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
  }>;
  
  /** Form sections for grouping */
  sections?: Array<{
    id: string;
    title: string;
    fields: (keyof TFormData)[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
  }>;
}

// ============================================================================
// HOOK INTEGRATION TYPES
// ============================================================================

/**
 * React Hook Form field array types for dynamic collections
 */
export interface UseFieldArrayTypes {
  /** Lookup keys field array */
  lookupKeysFieldArray: UseFieldArrayReturn<UserDetailsFormData, 'lookupKeys'>;
  /** App roles field array */
  appRolesFieldArray: UseFieldArrayReturn<UserDetailsFormData, 'appRoles'>;
  /** Admin tabs field array */
  tabsFieldArray: UseFieldArrayReturn<UserDetailsFormData, 'tabs'>;
}

/**
 * Form state management with React Hook Form integration
 */
export interface FormStateManager<TFormData extends FieldValues = UserDetailsFormData> {
  /** Form instance */
  form: UseFormReturn<TFormData>;
  /** Field arrays */
  fieldArrays: UseFieldArrayTypes;
  /** Form workflow state */
  workflow: FormWorkflowState;
  /** Validation state */
  validation: ValidationState;
  /** Error state */
  errors: ValidationErrors;
  /** Form actions */
  actions: {
    submit: () => Promise<void>;
    reset: () => void;
    validate: () => Promise<boolean>;
    setError: (field: keyof TFormData, message: string) => void;
    clearErrors: () => void;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Conditional form field type for dynamic behavior
 */
export type ConditionalField<T extends FieldValues> = {
  [K in keyof T]: {
    field: K;
    value: T[K];
    condition: (formValues: T) => boolean;
    required?: boolean;
    visible?: boolean;
    disabled?: boolean;
  };
}[keyof T];

/**
 * Form field configuration type
 */
export type FieldConfig<T extends FieldValues, K extends keyof T = keyof T> = {
  name: K;
  label?: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  validation?: z.ZodSchema<T[K]>;
  conditional?: ConditionalField<T>;
  accessibility?: AccessibilityProps;
};

/**
 * Complete form configuration
 */
export interface FormConfiguration<T extends FieldValues = UserDetailsFormData> {
  /** Form schema */
  schema: z.ZodSchema<T>;
  /** Field configurations */
  fields: FieldConfig<T>[];
  /** Default values */
  defaultValues: Partial<T>;
  /** Validation configuration */
  validation: ValidationConfig;
  /** Accessibility configuration */
  accessibility: AccessibilityProps;
  /** Internationalization configuration */
  i18n: InternationalizationProps;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard for user profile type
 */
export const isUserType = (userType: string): userType is UserType => {
  return userType === 'users' || userType === 'admins';
};

/**
 * Type guard for form mode
 */
export const isFormMode = (mode: string): mode is FormMode => {
  return mode === 'create' || mode === 'edit';
};

/**
 * Type guard for validation state
 */
export const isValidationState = (state: string): state is ValidationState => {
  return ['valid', 'invalid', 'pending', 'idle'].includes(state);
};

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  // Core types
  FormMode,
  UserType,
  UserProfileType,
  ThemeMode,
  ComponentSize,
  ValidationState,
  
  // Main interfaces
  UserDetailsProps,
  UserDetailsFormData,
  ProfileDetailsFormData,
  TabAccessItem,
  LookupKeyItem,
  AppRoleItem,
  
  // Configuration types
  ValidationErrors,
  ValidationConfig,
  ZodValidationSchemas,
  PaywallState,
  FormWorkflowState,
  FormCallbacks,
  
  // Integration types
  AccessibilityProps,
  InternationalizationProps,
  ThemeAwareProps,
  ThemeStoreState,
  UseFieldArrayTypes,
  FormStateManager,
  
  // Utility types
  ConditionalField,
  FieldConfig,
  FormConfiguration,
};

// Default export for convenience
export default UserDetailsProps;