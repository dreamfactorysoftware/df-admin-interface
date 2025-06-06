/**
 * ProfileDetails Component Type Definitions
 * 
 * Comprehensive TypeScript type definitions for the ProfileDetails component
 * supporting React Hook Form integration, Zod schema validation, theme management
 * with Zustand, and WCAG 2.1 AA accessibility compliance.
 * 
 * Replaces Angular profileDetailsGroup with React Hook Form compatible types
 * while maintaining exact functional parity with the original implementation.
 * 
 * @fileoverview TypeScript 5.8+ enhanced types for ProfileDetails component
 * @version 1.0.0
 */

import { ReactNode } from 'react';
import { 
  FieldErrors, 
  UseFormReturn, 
  SubmitHandler, 
  SubmitErrorHandler,
  FormFieldConfig,
  EnhancedValidationState,
  FormFieldError
} from '../../../types/forms';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize,
  FormEventHandlers,
  ValidationState
} from '../../../types/ui';
import { 
  ThemeMode, 
  ResolvedTheme, 
  UseThemeReturn 
} from '../../../types/theme';

// ============================================================================
// CORE PROFILE DETAILS TYPES
// ============================================================================

/**
 * ProfileDetails form data structure matching Angular profileDetailsGroup
 * Maintains exact field structure for seamless migration compatibility
 */
export interface ProfileDetailsFormData {
  /** User's unique identifier - typically email or username */
  username: string;
  
  /** User's email address for authentication and communication */
  email: string;
  
  /** User's first name for personalization */
  firstName: string;
  
  /** User's last name for full identification */
  lastName: string;
  
  /** Display name shown in UI - computed from firstName + lastName or custom */
  name: string;
  
  /** Optional phone number for contact purposes */
  phone?: string;
  
  /** Optional profile avatar URL or base64 image data */
  avatar?: string;
  
  /** User's timezone for proper date/time display */
  timezone?: string;
  
  /** User's preferred language for internationalization */
  locale?: string;
  
  /** User's role for authorization context */
  role?: string;
  
  /** Last login timestamp for security tracking */
  lastLogin?: Date;
  
  /** Account status for administrative control */
  isActive?: boolean;
  
  /** Email verification status */
  isEmailVerified?: boolean;
  
  /** Optional user preferences object */
  preferences?: UserPreferences;
}

/**
 * User preferences structure for customization options
 */
export interface UserPreferences {
  /** Theme preference */
  theme?: ThemeMode;
  
  /** Dashboard layout preference */
  dashboardLayout?: 'grid' | 'list' | 'compact';
  
  /** Default database connection timeout */
  defaultTimeout?: number;
  
  /** Show advanced options by default */
  showAdvancedOptions?: boolean;
  
  /** Email notification preferences */
  notifications?: NotificationPreferences;
  
  /** Accessibility preferences */
  accessibility?: AccessibilityPreferences;
}

/**
 * Email notification preferences
 */
export interface NotificationPreferences {
  /** Service creation notifications */
  serviceEvents?: boolean;
  
  /** System maintenance notifications */
  systemUpdates?: boolean;
  
  /** Security alert notifications */
  securityAlerts?: boolean;
  
  /** API usage threshold notifications */
  usageAlerts?: boolean;
  
  /** Weekly summary reports */
  weeklySummary?: boolean;
}

/**
 * Accessibility preferences for WCAG compliance
 */
export interface AccessibilityPreferences {
  /** Reduced motion preference */
  reduceMotion?: boolean;
  
  /** High contrast mode */
  highContrast?: boolean;
  
  /** Larger text scaling */
  largeText?: boolean;
  
  /** Screen reader optimizations */
  screenReader?: boolean;
  
  /** Keyboard navigation only */
  keyboardOnly?: boolean;
  
  /** Focus indicator enhancement */
  enhancedFocus?: boolean;
}

// ============================================================================
// COMPONENT PROPS AND CONFIGURATION
// ============================================================================

/**
 * ProfileDetails component props with comprehensive configuration options
 * Supports all React Hook Form patterns with Zod validation integration
 */
export interface ProfileDetailsProps extends BaseComponent {
  /** Initial form data - defaults to empty profile */
  initialData?: Partial<ProfileDetailsFormData>;
  
  /** Form submission handler with type safety */
  onSubmit?: SubmitHandler<ProfileDetailsFormData>;
  
  /** Form error handler for validation failures */
  onError?: SubmitErrorHandler<ProfileDetailsFormData>;
  
  /** Form data change callback for real-time updates */
  onChange?: (data: Partial<ProfileDetailsFormData>) => void;
  
  /** Cancel/close callback */
  onCancel?: () => void;
  
  /** Validation configuration options */
  validation?: ProfileValidationConfig;
  
  /** Theme integration configuration */
  theme?: ProfileThemeConfig;
  
  /** Accessibility configuration for WCAG 2.1 AA */
  accessibility?: ProfileAccessibilityConfig;
  
  /** Field visibility and editing permissions */
  permissions?: ProfilePermissions;
  
  /** Form layout and presentation options */
  layout?: ProfileLayoutConfig;
  
  /** Loading state management */
  loading?: boolean;
  
  /** Disabled state for read-only mode */
  disabled?: boolean;
  
  /** Show avatar upload functionality */
  showAvatar?: boolean;
  
  /** Show advanced user preferences */
  showPreferences?: boolean;
  
  /** Custom field configurations for dynamic forms */
  customFields?: FormFieldConfig<ProfileDetailsFormData>[];
  
  /** Form validation mode for React Hook Form */
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
  
  /** Re-validation mode after successful validation */
  reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
  
  /** Success message display callback */
  onSuccess?: (data: ProfileDetailsFormData) => void;
  
  /** Integration with external form instance */
  formInstance?: UseFormReturn<ProfileDetailsFormData>;
}

/**
 * Validation configuration for ProfileDetails form
 * Integrates with Zod schema validation system
 */
export interface ProfileValidationConfig {
  /** Real-time validation enabled */
  realTime?: boolean;
  
  /** Validation debounce delay in milliseconds */
  debounceMs?: number;
  
  /** Async validation for unique username/email checks */
  asyncValidation?: {
    /** Username uniqueness check */
    checkUsername?: (username: string) => Promise<boolean>;
    
    /** Email uniqueness check */
    checkEmail?: (email: string) => Promise<boolean>;
    
    /** Custom async validators */
    custom?: Record<keyof ProfileDetailsFormData, (value: any) => Promise<boolean | string>>;
  };
  
  /** Custom validation rules beyond Zod schema */
  customRules?: ProfileCustomValidationRules;
  
  /** Password strength requirements (if password field enabled) */
  passwordRules?: PasswordValidationRules;
  
  /** Email format validation configuration */
  emailValidation?: EmailValidationConfig;
  
  /** Phone number validation configuration */
  phoneValidation?: PhoneValidationConfig;
}

/**
 * Custom validation rules for profile fields
 */
export interface ProfileCustomValidationRules {
  /** Username validation rules */
  username?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    reservedWords?: string[];
    customValidator?: (value: string) => boolean | string;
  };
  
  /** Name validation rules */
  name?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => boolean | string;
  };
  
  /** Cross-field validation */
  crossField?: {
    /** Validate display name matches first + last name pattern */
    validateDisplayName?: boolean;
    /** Custom cross-field validators */
    custom?: (data: Partial<ProfileDetailsFormData>) => Record<string, string>;
  };
}

/**
 * Password validation rules for security compliance
 */
export interface PasswordValidationRules {
  /** Minimum password length */
  minLength?: number;
  
  /** Maximum password length */
  maxLength?: number;
  
  /** Require uppercase letters */
  requireUppercase?: boolean;
  
  /** Require lowercase letters */
  requireLowercase?: boolean;
  
  /** Require numeric digits */
  requireNumbers?: boolean;
  
  /** Require special characters */
  requireSpecialChars?: boolean;
  
  /** Banned common passwords */
  bannedPasswords?: string[];
  
  /** Custom password strength validator */
  customValidator?: (password: string) => { score: number; feedback: string[] };
}

/**
 * Email validation configuration
 */
export interface EmailValidationConfig {
  /** Email format validation pattern */
  pattern?: RegExp;
  
  /** Allowed email domains */
  allowedDomains?: string[];
  
  /** Blocked email domains */
  blockedDomains?: string[];
  
  /** Require email verification */
  requireVerification?: boolean;
  
  /** Custom email validator */
  customValidator?: (email: string) => boolean | string;
}

/**
 * Phone number validation configuration
 */
export interface PhoneValidationConfig {
  /** Phone number format pattern */
  pattern?: RegExp;
  
  /** Allowed country codes */
  allowedCountries?: string[];
  
  /** Default country for formatting */
  defaultCountry?: string;
  
  /** International format required */
  requireInternational?: boolean;
  
  /** Custom phone validator */
  customValidator?: (phone: string) => boolean | string;
}

// ============================================================================
// VALIDATION AND ERROR HANDLING
// ============================================================================

/**
 * Comprehensive validation errors with internationalization support
 * Extends base form validation with profile-specific error handling
 */
export interface ProfileValidationErrors extends FieldErrors<ProfileDetailsFormData> {
  /** Root-level form errors */
  root?: FormFieldError & {
    /** Error category for filtering */
    category?: 'validation' | 'network' | 'permission' | 'system';
    
    /** Error severity for UI styling */
    severity?: 'error' | 'warning' | 'info';
    
    /** Retry action available */
    retryable?: boolean;
  };
  
  /** Field-specific validation states */
  fieldStates?: Record<keyof ProfileDetailsFormData, EnhancedValidationState>;
  
  /** Async validation errors */
  asyncErrors?: Record<keyof ProfileDetailsFormData, string>;
  
  /** Cross-field validation errors */
  crossFieldErrors?: Record<string, string>;
}

/**
 * Internationalized error messages for profile validation
 * Supports multiple languages and contextual error descriptions
 */
export interface ProfileValidationMessages {
  /** Required field errors */
  required: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
  };
  
  /** Format validation errors */
  format: {
    email: string;
    phone: string;
    username: string;
  };
  
  /** Length validation errors */
  length: {
    usernameMin: string;
    usernameMax: string;
    nameMin: string;
    nameMax: string;
    passwordMin: string;
    passwordMax: string;
  };
  
  /** Uniqueness validation errors */
  uniqueness: {
    username: string;
    email: string;
  };
  
  /** Custom validation errors */
  custom: {
    invalidCharacters: string;
    reservedWord: string;
    weakPassword: string;
    blockedDomain: string;
  };
  
  /** System errors */
  system: {
    networkError: string;
    validationTimeout: string;
    serverError: string;
    permissionDenied: string;
  };
  
  /** Success messages */
  success: {
    profileUpdated: string;
    emailVerified: string;
    passwordChanged: string;
  };
}

// ============================================================================
// THEME AND STYLING
// ============================================================================

/**
 * Theme-aware component props for ProfileDetails styling
 * Integrates with Zustand theme state management
 */
export interface ProfileThemeConfig {
  /** Theme mode override */
  mode?: ThemeMode;
  
  /** Component variant for styling */
  variant?: ComponentVariant;
  
  /** Component size configuration */
  size?: ComponentSize;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Container styling options */
  container?: {
    /** Card-style container */
    card?: boolean;
    
    /** Full-width layout */
    fullWidth?: boolean;
    
    /** Compact spacing */
    compact?: boolean;
    
    /** Custom padding */
    padding?: ComponentSize;
    
    /** Border styling */
    bordered?: boolean;
    
    /** Shadow styling */
    shadow?: ComponentSize;
  };
  
  /** Form field styling */
  fields?: {
    /** Field size override */
    size?: ComponentSize;
    
    /** Field variant override */
    variant?: ComponentVariant;
    
    /** Label position */
    labelPosition?: 'top' | 'left' | 'floating';
    
    /** Show field icons */
    showIcons?: boolean;
    
    /** Custom field spacing */
    spacing?: ComponentSize;
  };
  
  /** Button styling configuration */
  buttons?: {
    /** Primary button variant */
    primary?: ComponentVariant;
    
    /** Secondary button variant */
    secondary?: ComponentVariant;
    
    /** Button size */
    size?: ComponentSize;
    
    /** Button layout */
    layout?: 'inline' | 'stacked' | 'split';
  };
}

/**
 * Theme integration interface for Zustand state management
 * Provides theme utilities and state management hooks
 */
export interface ProfileThemeIntegration extends UseThemeReturn {
  /** Get theme-appropriate field styling */
  getFieldClasses: (fieldName: keyof ProfileDetailsFormData) => string;
  
  /** Get theme-appropriate validation styling */
  getValidationClasses: (hasError: boolean, isValid?: boolean) => string;
  
  /** Get theme-appropriate button styling */
  getButtonClasses: (variant: ComponentVariant, size?: ComponentSize) => string;
  
  /** Get accessible color combinations */
  getAccessibleColors: () => {
    text: string;
    background: string;
    border: string;
    focus: string;
    error: string;
    success: string;
  };
  
  /** Check if current theme meets accessibility requirements */
  isAccessible: () => boolean;
}

// ============================================================================
// ACCESSIBILITY AND COMPLIANCE
// ============================================================================

/**
 * WCAG 2.1 AA accessibility configuration for ProfileDetails
 * Ensures comprehensive accessibility compliance and keyboard navigation
 */
export interface ProfileAccessibilityConfig {
  /** ARIA landmark configuration */
  landmarks?: {
    /** Form landmark label */
    form?: string;
    
    /** Error region label */
    errors?: string;
    
    /** Success region label */
    success?: string;
    
    /** Help region label */
    help?: string;
  };
  
  /** Screen reader optimizations */
  screenReader?: {
    /** Announce validation changes */
    announceValidation?: boolean;
    
    /** Announce form progress */
    announceProgress?: boolean;
    
    /** Live region politeness */
    liveRegion?: 'off' | 'polite' | 'assertive';
    
    /** Custom announcements */
    customAnnouncements?: Record<string, string>;
  };
  
  /** Keyboard navigation configuration */
  keyboard?: {
    /** Enable keyboard shortcuts */
    shortcuts?: boolean;
    
    /** Tab order customization */
    tabOrder?: (keyof ProfileDetailsFormData)[];
    
    /** Focus management strategy */
    focusStrategy?: 'linear' | 'circular' | 'smart';
    
    /** Skip links for complex forms */
    skipLinks?: boolean;
  };
  
  /** Focus management configuration */
  focus?: {
    /** Auto-focus first field */
    autoFocusFirst?: boolean;
    
    /** Focus invalid field on submit */
    focusOnError?: boolean;
    
    /** Enhanced focus indicators */
    enhancedIndicators?: boolean;
    
    /** Focus trap for modal forms */
    trapFocus?: boolean;
  };
  
  /** Color and contrast requirements */
  contrast?: {
    /** Minimum contrast ratio */
    minimumRatio?: number;
    
    /** Enhanced contrast mode */
    enhancedMode?: boolean;
    
    /** Error color contrast validation */
    validateErrorColors?: boolean;
  };
  
  /** Touch target requirements */
  touchTargets?: {
    /** Minimum touch target size */
    minimumSize?: number;
    
    /** Spacing between targets */
    minimumSpacing?: number;
    
    /** Enhanced touch targets */
    enhanced?: boolean;
  };
  
  /** Text and content accessibility */
  content?: {
    /** Maximum line length for readability */
    maxLineLength?: number;
    
    /** Minimum text size */
    minTextSize?: number;
    
    /** Language specification */
    language?: string;
    
    /** Reading level target */
    readingLevel?: 'simple' | 'intermediate' | 'advanced';
  };
}

/**
 * ARIA attributes interface for ProfileDetails accessibility
 * Provides comprehensive ARIA support for form elements and interactions
 */
export interface ProfileAriaAttributes {
  /** Form-level ARIA attributes */
  form?: {
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-labelledby'?: string;
    'role'?: 'form' | 'dialog' | 'region';
  };
  
  /** Field-level ARIA attributes */
  fields?: Partial<Record<keyof ProfileDetailsFormData, {
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
    'aria-invalid'?: boolean;
    'aria-errormessage'?: string;
    'aria-autocomplete'?: 'off' | 'on' | 'list' | 'both';
    'role'?: string;
  }>>;
  
  /** Button ARIA attributes */
  buttons?: {
    submit?: {
      'aria-label'?: string;
      'aria-describedby'?: string;
    };
    cancel?: {
      'aria-label'?: string;
      'aria-describedby'?: string;
    };
    reset?: {
      'aria-label'?: string;
      'aria-describedby'?: string;
    };
  };
  
  /** Status and feedback ARIA attributes */
  status?: {
    loading?: {
      'aria-label'?: string;
      'aria-live'?: 'off' | 'polite' | 'assertive';
    };
    error?: {
      'aria-label'?: string;
      'aria-live'?: 'off' | 'polite' | 'assertive';
    };
    success?: {
      'aria-label'?: string;
      'aria-live'?: 'off' | 'polite' | 'assertive';
    };
  };
}

// ============================================================================
// LAYOUT AND PRESENTATION
// ============================================================================

/**
 * ProfileDetails layout configuration for responsive design
 * Supports multiple layout patterns and responsive breakpoints
 */
export interface ProfileLayoutConfig {
  /** Layout type selection */
  type?: 'single-column' | 'two-column' | 'tabbed' | 'accordion' | 'wizard';
  
  /** Grid configuration for multi-column layouts */
  grid?: {
    /** Desktop columns */
    columns?: number;
    
    /** Mobile columns */
    mobileColumns?: number;
    
    /** Tablet columns */
    tabletColumns?: number;
    
    /** Column gap size */
    gap?: ComponentSize;
    
    /** Row gap size */
    rowGap?: ComponentSize;
  };
  
  /** Section grouping configuration */
  sections?: ProfileLayoutSection[];
  
  /** Responsive behavior */
  responsive?: {
    /** Breakpoint for mobile layout */
    mobileBreakpoint?: number;
    
    /** Breakpoint for tablet layout */
    tabletBreakpoint?: number;
    
    /** Stack fields on mobile */
    stackOnMobile?: boolean;
    
    /** Hide optional fields on mobile */
    hideOptionalOnMobile?: boolean;
  };
  
  /** Field ordering and visibility */
  fieldOrder?: (keyof ProfileDetailsFormData)[];
  
  /** Hidden fields */
  hiddenFields?: (keyof ProfileDetailsFormData)[];
  
  /** Required field indicators */
  showRequired?: boolean;
  
  /** Optional field indicators */
  showOptional?: boolean;
  
  /** Field help text display */
  showHelp?: 'always' | 'hover' | 'focus' | 'never';
}

/**
 * Layout section configuration for grouped fields
 */
export interface ProfileLayoutSection {
  /** Section identifier */
  id: string;
  
  /** Section title */
  title: string;
  
  /** Section description */
  description?: string;
  
  /** Fields in this section */
  fields: (keyof ProfileDetailsFormData)[];
  
  /** Section order priority */
  order: number;
  
  /** Collapsible section */
  collapsible?: boolean;
  
  /** Initially collapsed */
  defaultCollapsed?: boolean;
  
  /** Section icon */
  icon?: ReactNode;
  
  /** Section variant styling */
  variant?: ComponentVariant;
  
  /** Section visibility conditions */
  conditions?: Array<{
    field: keyof ProfileDetailsFormData;
    operator: 'equals' | 'notEquals' | 'in' | 'notIn';
    value: any;
  }>;
}

// ============================================================================
// PERMISSIONS AND SECURITY
// ============================================================================

/**
 * Field-level permissions for ProfileDetails component
 * Controls editing capabilities and field visibility based on user roles
 */
export interface ProfilePermissions {
  /** Read permissions for each field */
  read?: Partial<Record<keyof ProfileDetailsFormData, boolean>>;
  
  /** Write permissions for each field */
  write?: Partial<Record<keyof ProfileDetailsFormData, boolean>>;
  
  /** Role-based permissions */
  roles?: Record<string, {
    read: (keyof ProfileDetailsFormData)[];
    write: (keyof ProfileDetailsFormData)[];
  }>;
  
  /** Conditional permissions based on user context */
  conditional?: Array<{
    condition: (user: any) => boolean;
    permissions: Partial<Record<keyof ProfileDetailsFormData, 'read' | 'write' | 'none'>>;
  }>;
  
  /** Field-level security rules */
  security?: {
    /** Sensitive fields requiring additional confirmation */
    sensitiveFields?: (keyof ProfileDetailsFormData)[];
    
    /** Fields requiring re-authentication */
    reAuthFields?: (keyof ProfileDetailsFormData)[];
    
    /** Fields with audit logging */
    auditedFields?: (keyof ProfileDetailsFormData)[];
  };
}

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Form field configuration specifically for ProfileDetails
 * Extends base FormFieldConfig with profile-specific enhancements
 */
export interface ProfileFormFieldConfig extends FormFieldConfig<ProfileDetailsFormData> {
  /** Profile-specific field metadata */
  profileMeta?: {
    /** Field category for grouping */
    category?: 'personal' | 'contact' | 'preferences' | 'security' | 'system';
    
    /** Field importance level */
    importance?: 'required' | 'recommended' | 'optional';
    
    /** Field sensitivity level */
    sensitivity?: 'public' | 'private' | 'confidential';
    
    /** Show in profile summary */
    showInSummary?: boolean;
    
    /** Profile completion weight */
    completionWeight?: number;
  };
  
  /** Avatar-specific configuration */
  avatar?: {
    /** Allowed file types */
    allowedTypes?: string[];
    
    /** Maximum file size */
    maxSize?: number;
    
    /** Image dimensions */
    dimensions?: {
      width: number;
      height: number;
    };
    
    /** Image quality settings */
    quality?: number;
    
    /** Crop options */
    cropOptions?: {
      aspectRatio?: number;
      cropShape?: 'rect' | 'round';
    };
  };
}

/**
 * ProfileDetails form state management interface
 * Provides comprehensive state tracking and manipulation
 */
export interface ProfileFormState {
  /** Current form data */
  data: ProfileDetailsFormData;
  
  /** Original form data for comparison */
  originalData: ProfileDetailsFormData;
  
  /** Form validation state */
  validationState: ValidationState;
  
  /** Form submission state */
  submissionState: {
    isSubmitting: boolean;
    isSubmitted: boolean;
    submitCount: number;
    lastSubmissionTime?: Date;
  };
  
  /** Form dirty tracking */
  dirtyFields: Set<keyof ProfileDetailsFormData>;
  
  /** Field interaction tracking */
  touchedFields: Set<keyof ProfileDetailsFormData>;
  
  /** Form completion percentage */
  completionPercentage: number;
  
  /** Profile validation score */
  profileScore: {
    total: number;
    breakdown: Record<keyof ProfileDetailsFormData, number>;
  };
}

/**
 * ProfileDetails event handlers interface
 * Comprehensive event handling for all profile interactions
 */
export interface ProfileEventHandlers extends FormEventHandlers {
  /** Avatar upload handlers */
  onAvatarUpload?: (file: File) => Promise<string>;
  onAvatarRemove?: () => void;
  onAvatarCrop?: (croppedImage: string) => void;
  
  /** Preference change handlers */
  onThemeChange?: (theme: ThemeMode) => void;
  onLocaleChange?: (locale: string) => void;
  onTimezoneChange?: (timezone: string) => void;
  
  /** Security event handlers */
  onPasswordChange?: (oldPassword: string, newPassword: string) => Promise<void>;
  onEmailVerification?: (email: string) => Promise<void>;
  onAccountDeactivation?: () => Promise<void>;
  
  /** Profile completion handlers */
  onFieldComplete?: (field: keyof ProfileDetailsFormData, value: any) => void;
  onSectionComplete?: (section: string) => void;
  onProfileComplete?: () => void;
  
  /** Async validation handlers */
  onAsyncValidationStart?: (field: keyof ProfileDetailsFormData) => void;
  onAsyncValidationComplete?: (field: keyof ProfileDetailsFormData, result: boolean) => void;
}

/**
 * TypeScript utility types for enhanced type safety
 */
export type ProfileFormFieldName = keyof ProfileDetailsFormData;
export type ProfileFormFieldValue<K extends ProfileFormFieldName> = ProfileDetailsFormData[K];
export type ProfileFormPartial = Partial<ProfileDetailsFormData>;
export type ProfileFormRequired = Required<ProfileDetailsFormData>;

/**
 * Template literal types for enhanced validation (TypeScript 5.8+)
 */
export type ProfileValidationKey<T extends string> = `profile.validation.${T}`;
export type ProfileErrorKey<T extends string> = `profile.error.${T}`;
export type ProfileSuccessKey<T extends string> = `profile.success.${T}`;

/**
 * Conditional types for permission checking
 */
export type HasPermission<T extends ProfileFormFieldName> = T extends keyof ProfilePermissions['write'] 
  ? ProfilePermissions['write'][T] extends true 
    ? true 
    : false 
  : false;

/**
 * Branded types for enhanced type safety
 */
export type ProfileId = string & { readonly __brand: 'ProfileId' };
export type Username = string & { readonly __brand: 'Username' };
export type EmailAddress = string & { readonly __brand: 'EmailAddress' };

// ============================================================================
// EXPORT DECLARATIONS
// ============================================================================

/**
 * Main ProfileDetails component type exports
 * Provides comprehensive type coverage for all profile-related functionality
 */
export type {
  // Core types
  ProfileDetailsFormData,
  ProfileDetailsProps,
  ProfileValidationErrors,
  
  // Configuration types
  ProfileValidationConfig,
  ProfileThemeConfig,
  ProfileAccessibilityConfig,
  ProfileLayoutConfig,
  ProfilePermissions,
  
  // Utility types
  ProfileFormFieldConfig,
  ProfileFormState,
  ProfileEventHandlers,
  
  // Enhanced types
  UserPreferences,
  NotificationPreferences,
  AccessibilityPreferences,
  ProfileAriaAttributes,
  ProfileLayoutSection,
  
  // Validation types
  ProfileCustomValidationRules,
  PasswordValidationRules,
  EmailValidationConfig,
  PhoneValidationConfig,
  ProfileValidationMessages,
  
  // Theme integration
  ProfileThemeIntegration,
  
  // Template literal types
  ProfileValidationKey,
  ProfileErrorKey,
  ProfileSuccessKey,
  
  // Utility types
  ProfileFormFieldName,
  ProfileFormFieldValue,
  ProfileFormPartial,
  ProfileFormRequired,
  HasPermission,
  
  // Branded types
  ProfileId,
  Username,
  EmailAddress,
};

/**
 * Default export with complete type definitions
 * Provides single import for all ProfileDetails types
 */
export default {
  ProfileDetailsFormData,
  ProfileDetailsProps,
  ProfileValidationErrors,
  ProfileValidationConfig,
  ProfileThemeConfig,
  ProfileAccessibilityConfig,
  ProfileLayoutConfig,
  ProfilePermissions,
  ProfileFormFieldConfig,
  ProfileFormState,
  ProfileEventHandlers,
} as const;