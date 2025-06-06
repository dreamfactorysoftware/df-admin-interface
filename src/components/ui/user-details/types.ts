/**
 * TypeScript type definitions for React User Details Component
 * 
 * Comprehensive type definitions supporting React Hook Form integration, WCAG 2.1 AA
 * accessibility compliance, Zod validation schemas, and seamless integration with
 * existing DreamFactory user management interfaces.
 * 
 * Key Features:
 * - React Hook Form integration with useForm, useFieldArray, and useWatch hooks
 * - Backward compatibility with existing UserProfileType, AppType, and RoleType interfaces
 * - WCAG 2.1 AA accessibility compliance with ARIA attributes and keyboard navigation
 * - Zod validation schema compatibility for type-safe form validation
 * - Zustand store integration for consistent theme support
 * - Support for both admin and user creation/editing workflows
 * - Next.js i18n integration for internationalized error messages
 * - Generic type parameters for flexible user profile type support
 * - Controlled and uncontrolled component mode support
 * 
 * @fileoverview User Details Component Type Definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { ReactNode, ComponentType, RefObject } from 'react';
import { 
  UseFormReturn, 
  UseFormRegister, 
  UseFormWatch, 
  UseFormSetValue, 
  UseFormTrigger, 
  UseFormGetValues,
  UseFormHandleSubmit,
  UseFormReset,
  Control,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  SubmitHandler,
  SubmitErrorHandler
} from 'react-hook-form';
import { z } from 'zod';
import { UserProfile, AdminProfile, UserProfileType, LookupKey, UserAppRole } from '../../../types/user';
import { AppType } from '../../../types/apps';
import { RoleType } from '../../../types/role';
import { ThemeMode, ResolvedTheme } from '../../../types/theme';
import { ComponentVariant, ComponentSize, BaseComponent } from '../../../types/ui';

// ============================================================================
// CORE TYPE DEFINITIONS
// ============================================================================

/**
 * Form mode type for discriminating between create and edit operations
 */
export type FormMode = 'create' | 'edit';

/**
 * User type discrimination for admin vs user workflows
 */
export type UserType = 'admin' | 'user';

/**
 * Generic user profile type for flexible component usage
 */
export type GenericUserProfile<T extends UserType = UserType> = 
  T extends 'admin' ? AdminProfile : UserProfile;

/**
 * Tab access control item for admin workflows
 */
export interface TabAccessItem {
  /** Tab identifier */
  id: string;
  /** Tab display name */
  name: string;
  /** Tab description */
  description?: string;
  /** Is tab accessible by user */
  accessible: boolean;
  /** Tab category for grouping */
  category?: string;
  /** Tab order for display */
  order?: number;
  /** Is tab required for admin users */
  required?: boolean;
}

/**
 * Lookup key item for FormArray integration
 */
export interface LookupKeyItem {
  /** Lookup key identifier */
  id?: number;
  /** Lookup key name */
  name: string;
  /** Lookup key value */
  value: string;
  /** Is lookup key private */
  private: boolean;
  /** Lookup key description */
  description?: string;
  /** Mark for deletion in FormArray */
  _delete?: boolean;
  /** Unique identifier for React keys */
  _formId?: string;
}

/**
 * App role item for FormArray integration
 */
export interface AppRoleItem {
  /** App-role mapping identifier */
  id?: number;
  /** Application identifier */
  app_id: number;
  /** Role identifier */
  role_id: number;
  /** Application reference for display */
  app?: AppType;
  /** Role reference for display */
  role?: RoleType;
  /** Mark for deletion in FormArray */
  _delete?: boolean;
  /** Unique identifier for React keys */
  _formId?: string;
}

/**
 * Paywall state for feature restriction and access control
 */
export interface PaywallState {
  /** Is paywall active */
  isActive: boolean;
  /** Blocked features */
  blockedFeatures: string[];
  /** User's current plan */
  currentPlan?: string;
  /** Required plan for access */
  requiredPlan?: string;
  /** Upgrade URL */
  upgradeUrl?: string;
  /** Feature limit information */
  limits?: {
    maxUsers?: number;
    maxAdmins?: number;
    maxApps?: number;
    maxRoles?: number;
  };
}

// ============================================================================
// FORM DATA STRUCTURES
// ============================================================================

/**
 * Comprehensive form data structure matching Angular reactive form pattern
 * Enhanced with React Hook Form integration and Zod validation support
 */
export interface UserDetailsFormData {
  /** Core profile details group */
  profileDetailsGroup: {
    /** User identifier (for edit mode) */
    id?: number;
    /** Username */
    username: string;
    /** Email address */
    email: string;
    /** First name */
    first_name?: string;
    /** Last name */
    last_name?: string;
    /** Display name */
    display_name?: string;
    /** Phone number */
    phone?: string;
    /** Is user active */
    is_active: boolean;
    /** Password (for creation) */
    password?: string;
    /** Confirm password (for creation) */
    confirmPassword?: string;
    /** Security question */
    security_question?: string;
    /** Security answer */
    security_answer?: string;
    /** User type for admin workflows */
    userType?: UserType;
    /** Is system admin (admin workflow only) */
    is_sys_admin?: boolean;
  };
  
  /** Tab access configuration for admin users */
  tabs: TabAccessItem[];
  
  /** Lookup keys FormArray */
  lookupKeys: LookupKeyItem[];
  
  /** App roles FormArray */
  appRoles: AppRoleItem[];
}

/**
 * Validation errors with internationalized messages
 */
export interface ValidationErrors {
  /** Field-specific errors */
  fieldErrors: FieldErrors<UserDetailsFormData>;
  /** Global form errors */
  globalErrors: string[];
  /** Server-side validation errors */
  serverErrors: Record<string, string[]>;
  /** Async validation errors */
  asyncErrors: Record<string, string>;
  /** Error timestamps for debugging */
  errorTimestamps: Record<string, Date>;
  /** Internationalized error messages */
  i18nErrors: Record<string, {
    key: string;
    defaultMessage: string;
    values?: Record<string, any>;
  }>;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

/**
 * Theme-aware props for consistent styling
 */
export interface ThemeAwareProps {
  /** Current theme mode */
  theme?: ThemeMode;
  /** Resolved theme after system detection */
  resolvedTheme?: ResolvedTheme;
  /** Custom theme class override */
  themeClass?: string;
  /** Force theme regardless of user preference */
  forceTheme?: ResolvedTheme;
}

/**
 * Accessibility props ensuring WCAG 2.1 AA compliance
 */
export interface AccessibilityProps {
  /** ARIA label for component */
  'aria-label'?: string;
  /** ARIA described by reference */
  'aria-describedby'?: string;
  /** ARIA labeled by reference */
  'aria-labelledby'?: string;
  /** ARIA required attribute */
  'aria-required'?: boolean;
  /** ARIA expanded state */
  'aria-expanded'?: boolean;
  /** ARIA hidden state */
  'aria-hidden'?: boolean;
  /** Component role */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Keyboard navigation handler */
  onKeyDown?: (event: React.KeyboardEvent) => void;
  /** Focus management */
  autoFocus?: boolean;
  /** Initial focus reference */
  initialFocus?: RefObject<HTMLElement>;
  /** Skip link configuration */
  skipLink?: {
    target: string;
    text: string;
  };
}

/**
 * Form callback handlers for parent component integration
 */
export interface FormCallbacks<T extends UserType = UserType> {
  /** Form submission handler */
  onSubmit?: SubmitHandler<UserDetailsFormData>;
  /** Form submission error handler */
  onError?: SubmitErrorHandler<UserDetailsFormData>;
  /** Form validation handler */
  onValidate?: (isValid: boolean, errors: ValidationErrors) => void;
  /** Form change handler */
  onChange?: (data: Partial<UserDetailsFormData>, changedFields: string[]) => void;
  /** Form reset handler */
  onReset?: () => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Tab access change handler (admin only) */
  onTabAccessChange?: (tabs: TabAccessItem[]) => void;
  /** Lookup key changes handler */
  onLookupKeysChange?: (lookupKeys: LookupKeyItem[]) => void;
  /** App role changes handler */
  onAppRolesChange?: (appRoles: AppRoleItem[]) => void;
  /** User type change handler */
  onUserTypeChange?: (userType: UserType) => void;
  /** Before submit validation */
  beforeSubmit?: (data: UserDetailsFormData) => Promise<boolean> | boolean;
  /** After submit success */
  afterSubmit?: (data: UserDetailsFormData, response?: any) => void;
}

/**
 * Main component props with generic type support
 */
export interface UserDetailsProps<T extends UserType = UserType> 
  extends BaseComponent, ThemeAwareProps, AccessibilityProps {
  
  // ============================================================================
  // CORE CONFIGURATION
  // ============================================================================
  
  /** Form operation mode */
  mode: FormMode;
  
  /** User workflow type */
  userType: T;
  
  /** Initial user data for edit mode */
  initialData?: Partial<GenericUserProfile<T>>;
  
  /** Default form values */
  defaultValues?: Partial<UserDetailsFormData>;
  
  /** Is form in read-only mode */
  readOnly?: boolean;
  
  /** Is form currently loading */
  loading?: boolean;
  
  /** Is form currently submitting */
  submitting?: boolean;
  
  // ============================================================================
  // REACT HOOK FORM INTEGRATION
  // ============================================================================
  
  /** External form instance for controlled mode */
  form?: UseFormReturn<UserDetailsFormData>;
  
  /** Form control for integration */
  control?: Control<UserDetailsFormData>;
  
  /** Form register function */
  register?: UseFormRegister<UserDetailsFormData>;
  
  /** Form watch function */
  watch?: UseFormWatch<UserDetailsFormData>;
  
  /** Form setValue function */
  setValue?: UseFormSetValue<UserDetailsFormData>;
  
  /** Form trigger validation function */
  trigger?: UseFormTrigger<UserDetailsFormData>;
  
  /** Form getValues function */
  getValues?: UseFormGetValues<UserDetailsFormData>;
  
  /** Form handleSubmit function */
  handleSubmit?: UseFormHandleSubmit<UserDetailsFormData>;
  
  /** Form reset function */
  reset?: UseFormReset<UserDetailsFormData>;
  
  // ============================================================================
  // VALIDATION CONFIGURATION
  // ============================================================================
  
  /** Zod validation schema */
  validationSchema?: z.ZodSchema<UserDetailsFormData>;
  
  /** Custom validation rules */
  customValidation?: Record<string, (value: any, formData: UserDetailsFormData) => string | true>;
  
  /** Async validation functions */
  asyncValidation?: Record<string, (value: any, formData: UserDetailsFormData) => Promise<string | true>>;
  
  /** Validation timing configuration */
  validationTiming?: {
    mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
    reValidateMode?: 'onChange' | 'onBlur' | 'onSubmit';
    shouldFocusError?: boolean;
    delayError?: number;
  };
  
  // ============================================================================
  // DATA SOURCE CONFIGURATION
  // ============================================================================
  
  /** Available applications for role assignment */
  availableApps?: AppType[];
  
  /** Available roles for assignment */
  availableRoles?: RoleType[];
  
  /** Available tabs for admin access control */
  availableTabs?: TabAccessItem[];
  
  /** System-defined lookup keys */
  systemLookupKeys?: LookupKey[];
  
  /** Is apps data loading */
  appsLoading?: boolean;
  
  /** Is roles data loading */
  rolesLoading?: boolean;
  
  /** Data fetch error */
  dataError?: string;
  
  // ============================================================================
  // WORKFLOW CONFIGURATION
  // ============================================================================
  
  /** Enable tab access control (admin workflow) */
  enableTabAccess?: boolean;
  
  /** Enable lookup keys management */
  enableLookupKeys?: boolean;
  
  /** Enable app role assignment */
  enableAppRoles?: boolean;
  
  /** Enable password fields (create mode) */
  enablePassword?: boolean;
  
  /** Enable security questions */
  enableSecurityQuestions?: boolean;
  
  /** Enable user type selection */
  enableUserTypeSelection?: boolean;
  
  /** Required fields configuration */
  requiredFields?: (keyof UserDetailsFormData['profileDetailsGroup'])[];
  
  /** Hidden fields configuration */
  hiddenFields?: (keyof UserDetailsFormData['profileDetailsGroup'])[];
  
  /** Conditional field visibility */
  conditionalFields?: Record<string, {
    condition: (data: UserDetailsFormData) => boolean;
    fields: string[];
  }>;
  
  // ============================================================================
  // UI CUSTOMIZATION
  // ============================================================================
  
  /** Component size variant */
  size?: ComponentSize;
  
  /** Component style variant */
  variant?: ComponentVariant;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Form layout configuration */
  layout?: {
    type?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    spacing?: ComponentSize;
    sections?: {
      profile?: boolean;
      tabs?: boolean;
      lookupKeys?: boolean;
      appRoles?: boolean;
    };
  };
  
  /** Custom field renderers */
  fieldRenderers?: Partial<Record<string, ComponentType<any>>>;
  
  /** Custom section headers */
  sectionHeaders?: {
    profile?: string;
    tabs?: string;
    lookupKeys?: string;
    appRoles?: string;
  };
  
  // ============================================================================
  // INTERNATIONALIZATION
  // ============================================================================
  
  /** Locale for internationalization */
  locale?: string;
  
  /** Custom translations */
  translations?: Record<string, string>;
  
  /** Translation namespace */
  translationNamespace?: string;
  
  /** Date format for locale */
  dateFormat?: string;
  
  /** Number format for locale */
  numberFormat?: string;
  
  // ============================================================================
  // PAYWALL INTEGRATION
  // ============================================================================
  
  /** Paywall state for feature restrictions */
  paywallState?: PaywallState;
  
  /** Paywall check handler */
  onPaywallCheck?: (feature: string) => boolean;
  
  /** Paywall upgrade handler */
  onPaywallUpgrade?: (feature: string) => void;
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  /** Form callbacks */
  callbacks?: FormCallbacks<T>;
  
  /** Field change handlers */
  onFieldChange?: Record<string, (value: any, field: string) => void>;
  
  /** Field focus handlers */
  onFieldFocus?: Record<string, () => void>;
  
  /** Field blur handlers */
  onFieldBlur?: Record<string, () => void>;
  
  // ============================================================================
  // ADVANCED FEATURES
  // ============================================================================
  
  /** Auto-save configuration */
  autoSave?: {
    enabled: boolean;
    interval: number; // milliseconds
    onSave: (data: Partial<UserDetailsFormData>) => Promise<void>;
    indicator?: ReactNode;
  };
  
  /** Form state persistence */
  persistence?: {
    enabled: boolean;
    key: string;
    storage?: 'localStorage' | 'sessionStorage';
    exclude?: string[];
  };
  
  /** Performance monitoring */
  performanceMonitoring?: {
    enabled: boolean;
    onMetrics: (metrics: FormPerformanceMetrics) => void;
  };
  
  /** Debug mode for development */
  debug?: boolean;
  
  /** Test identifiers for automation */
  testIds?: Record<string, string>;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * User details form hook return type
 */
export interface UseUserDetailsFormReturn<T extends UserType = UserType> {
  /** Form instance */
  form: UseFormReturn<UserDetailsFormData>;
  
  /** Form state */
  formState: {
    isValid: boolean;
    isDirty: boolean;
    isSubmitting: boolean;
    isLoading: boolean;
    errors: ValidationErrors;
    touchedFields: Record<string, boolean>;
    dirtyFields: Record<string, boolean>;
  };
  
  /** Form methods */
  methods: {
    handleSubmit: UseFormHandleSubmit<UserDetailsFormData>;
    reset: (data?: Partial<UserDetailsFormData>) => void;
    validate: () => Promise<boolean>;
    validateField: (field: string) => Promise<boolean>;
    setError: (field: string, error: string) => void;
    clearErrors: (fields?: string[]) => void;
    setFieldValue: <K extends keyof UserDetailsFormData>(field: K, value: UserDetailsFormData[K]) => void;
    getFieldValue: <K extends keyof UserDetailsFormData>(field: K) => UserDetailsFormData[K];
  };
  
  /** Field arrays */
  fieldArrays: {
    tabs: {
      fields: TabAccessItem[];
      append: (item: TabAccessItem) => void;
      remove: (index: number) => void;
      update: (index: number, item: TabAccessItem) => void;
      move: (from: number, to: number) => void;
    };
    lookupKeys: {
      fields: LookupKeyItem[];
      append: (item: LookupKeyItem) => void;
      remove: (index: number) => void;
      update: (index: number, item: LookupKeyItem) => void;
      move: (from: number, to: number) => void;
    };
    appRoles: {
      fields: AppRoleItem[];
      append: (item: AppRoleItem) => void;
      remove: (index: number) => void;
      update: (index: number, item: AppRoleItem) => void;
      move: (from: number, to: number) => void;
    };
  };
  
  /** Computed values */
  computed: {
    isCreateMode: boolean;
    isEditMode: boolean;
    isAdminWorkflow: boolean;
    isUserWorkflow: boolean;
    hasChanges: boolean;
    canSubmit: boolean;
    canReset: boolean;
    canCancel: boolean;
    isPaywallBlocked: (feature: string) => boolean;
  };
  
  /** Performance metrics */
  metrics: FormPerformanceMetrics;
}

/**
 * Form performance metrics for monitoring
 */
export interface FormPerformanceMetrics {
  /** Render count */
  renderCount: number;
  
  /** Validation metrics */
  validation: {
    averageTime: number;
    maxTime: number;
    totalValidations: number;
    errorCount: number;
  };
  
  /** Form interaction metrics */
  interaction: {
    firstInputTime?: Date;
    lastChangeTime?: Date;
    totalChanges: number;
    fieldChanges: Record<string, number>;
  };
  
  /** Submission metrics */
  submission: {
    attempts: number;
    successCount: number;
    errorCount: number;
    averageTime: number;
    lastSubmissionTime?: Date;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Form field path type for type-safe field access
 */
export type UserDetailsFormPath = Path<UserDetailsFormData>;

/**
 * Form field value type for type-safe value access
 */
export type UserDetailsFormValue<T extends UserDetailsFormPath> = PathValue<UserDetailsFormData, T>;

/**
 * Form submission data type
 */
export type UserDetailsSubmissionData = UserDetailsFormData;

/**
 * Component ref type for external control
 */
export interface UserDetailsRef {
  /** Submit form programmatically */
  submit: () => Promise<boolean>;
  
  /** Reset form to initial state */
  reset: () => void;
  
  /** Validate entire form */
  validate: () => Promise<boolean>;
  
  /** Get current form data */
  getFormData: () => UserDetailsFormData;
  
  /** Set form data */
  setFormData: (data: Partial<UserDetailsFormData>) => void;
  
  /** Focus specific field */
  focusField: (field: UserDetailsFormPath) => void;
  
  /** Get form metrics */
  getMetrics: () => FormPerformanceMetrics;
}

// ============================================================================
// ZOD SCHEMA TYPES
// ============================================================================

/**
 * Zod schema type for user details form validation
 */
export type UserDetailsValidationSchema = z.ZodSchema<UserDetailsFormData>;

/**
 * Inferred type from Zod schema
 */
export type UserDetailsSchemaType = z.infer<UserDetailsValidationSchema>;

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * User details form context for provider pattern
 */
export interface UserDetailsContextValue<T extends UserType = UserType> {
  /** Component props */
  props: UserDetailsProps<T>;
  
  /** Form hook return */
  form: UseUserDetailsFormReturn<T>;
  
  /** Theme context */
  theme: {
    mode: ThemeMode;
    resolvedTheme: ResolvedTheme;
    toggleTheme: () => void;
  };
  
  /** Accessibility context */
  accessibility: {
    announceChange: (message: string) => void;
    focusManagement: {
      trapFocus: boolean;
      restoreFocus: boolean;
      initialFocus?: string;
    };
  };
  
  /** Internationalization context */
  i18n: {
    locale: string;
    translate: (key: string, values?: Record<string, any>) => string;
    formatDate: (date: Date) => string;
    formatNumber: (number: number) => string;
  };
}

// ============================================================================
// EXPORT TYPES FOR EXTERNAL USE
// ============================================================================

export type {
  // Main component props
  UserDetailsProps,
  
  // Form data and validation
  UserDetailsFormData,
  ValidationErrors,
  
  // Hook return types
  UseUserDetailsFormReturn,
  FormPerformanceMetrics,
  
  // Utility types
  UserDetailsFormPath,
  UserDetailsFormValue,
  UserDetailsSubmissionData,
  UserDetailsRef,
  UserDetailsValidationSchema,
  UserDetailsSchemaType,
  UserDetailsContextValue,
  
  // Core types
  FormMode,
  UserType,
  GenericUserProfile,
  TabAccessItem,
  LookupKeyItem,
  AppRoleItem,
  PaywallState,
  
  // Styling and accessibility
  ThemeAwareProps,
  AccessibilityProps,
  FormCallbacks,
};

// Default export for convenience
export default UserDetailsProps;