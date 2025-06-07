/**
 * TypeScript type definitions for the React User Application Roles component.
 * 
 * Defines comprehensive component props interfaces, form field types, and integration 
 * patterns for React Hook Form with useFieldArray hook. Provides backward compatibility 
 * with existing AppType and RoleType interfaces while adding React-specific patterns 
 * for hooks and event handling.
 * 
 * Includes WCAG 2.1 AA accessibility compliance, Zod validation schemas, theme 
 * integration, and Next.js i18n support.
 * 
 * @fileoverview User Application Roles component type definitions
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+
 */

import { 
  Control, 
  FieldArrayWithId, 
  FieldErrors, 
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  UseFormTrigger,
  Path,
  PathValue,
  FieldPath,
} from 'react-hook-form';
import { z } from 'zod';
import { ComponentPropsWithoutRef, ReactNode } from 'react';

// Import existing types for compatibility
import type { AppType, RoleType } from '../../../types/apps';
import type { BaseComponent, ComponentVariant, ComponentSize, SelectOption } from '../../../types/ui';

// ============================================================================
// Form Field Integration Types
// ============================================================================

/**
 * User application role assignment data structure
 * Compatible with React Hook Form useFieldArray and existing API interfaces
 */
export interface UserAppRole {
  /** Unique assignment ID (auto-generated) */
  id: string;
  /** Application ID from AppType */
  appId: number;
  /** Role ID from RoleType */
  roleId: number;
  /** Application details (populated for display) */
  app?: AppType;
  /** Role details (populated for display) */
  role?: RoleType;
  /** Whether this assignment is active */
  isActive: boolean;
  /** Assignment creation timestamp */
  createdAt?: string;
  /** Assignment modification timestamp */
  modifiedAt?: string;
  /** Assignment notes or comments */
  notes?: string;
}

/**
 * Form data structure for user application roles management
 * Optimized for React Hook Form integration with validation
 */
export interface UserAppRolesFormData {
  /** Array of user application role assignments */
  userAppRoles: UserAppRole[];
  /** User ID this assignment belongs to */
  userId?: number;
  /** Global assignment settings */
  settings?: {
    /** Whether to auto-activate new assignments */
    autoActivate: boolean;
    /** Whether to inherit parent role permissions */
    inheritPermissions: boolean;
    /** Default notes for new assignments */
    defaultNotes?: string;
  };
}

/**
 * Field registration types for React Hook Form useFieldArray integration
 * Provides proper TypeScript inference for form field operations
 */
export interface UserAppRoleFieldArrayConfig {
  /** Field array name in the form */
  name: Path<UserAppRolesFormData>;
  /** React Hook Form control object */
  control: Control<UserAppRolesFormData>;
  /** Field registration function */
  register: UseFormRegister<UserAppRolesFormData>;
  /** Form value watcher */
  watch: UseFormWatch<UserAppRolesFormData>;
  /** Field value setter */
  setValue: UseFormSetValue<UserAppRolesFormData>;
  /** Validation trigger */
  trigger: UseFormTrigger<UserAppRolesFormData>;
  /** Field array utilities */
  fieldArray: UseFieldArrayReturn<UserAppRolesFormData, Path<UserAppRolesFormData>>;
  /** Form validation errors */
  errors: FieldErrors<UserAppRolesFormData>;
}

// ============================================================================
// Component Props Interfaces
// ============================================================================

/**
 * Main component props interface replacing Angular @Input decorator patterns
 * Supports both controlled and uncontrolled component modes
 */
export interface UserAppRolesProps extends BaseComponent {
  /** Field array configuration for React Hook Form integration */
  fieldArrayConfig: UserAppRoleFieldArrayConfig;
  
  /** Available applications for selection */
  availableApps: AppType[];
  
  /** Available roles for selection */
  availableRoles: RoleType[];
  
  /** Initial form values */
  defaultValues?: UserAppRole[];
  
  /** Component display mode */
  mode?: UserAppRolesMode;
  
  /** Component size variant */
  size?: ComponentSize;
  
  /** Component style variant */
  variant?: ComponentVariant;
  
  /** Whether the component is in loading state */
  loading?: boolean;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Whether the component is read-only */
  readOnly?: boolean;
  
  /** Maximum number of role assignments allowed */
  maxAssignments?: number;
  
  /** Minimum number of role assignments required */
  minAssignments?: number;
  
  /** Whether to show the add new assignment button */
  showAddButton?: boolean;
  
  /** Whether to show the remove assignment buttons */
  showRemoveButtons?: boolean;
  
  /** Whether to show assignment status toggles */
  showStatusToggles?: boolean;
  
  /** Whether to show assignment notes fields */
  showNotesFields?: boolean;
  
  /** Custom validation rules beyond schema validation */
  customValidation?: UserAppRoleValidationRules;
  
  /** Event handlers */
  onAssignmentAdd?: (assignment: UserAppRole) => void;
  onAssignmentRemove?: (assignmentId: string) => void;
  onAssignmentChange?: (assignments: UserAppRole[]) => void;
  onValidationError?: (errors: FieldErrors<UserAppRolesFormData>) => void;
  
  /** Accessibility configuration */
  accessibility?: UserAppRoleAccessibilityConfig;
  
  /** Theme and styling configuration */
  theme?: UserAppRoleThemeConfig;
  
  /** Internationalization configuration */
  i18n?: UserAppRoleI18nConfig;
  
  /** Testing configuration */
  testConfig?: UserAppRoleTestConfig;
}

/**
 * Component display modes for different use cases
 */
export type UserAppRolesMode = 
  | 'full'          // Full editing capability with all controls
  | 'compact'       // Condensed view with minimal controls  
  | 'readonly'      // Display-only mode for viewing assignments
  | 'selection'     // Selection mode for choosing assignments
  | 'wizard'        // Step-by-step assignment creation
  | 'inline';       // Inline editing within tables or forms

// ============================================================================
// Validation Schema Types (Zod Integration)
// ============================================================================

/**
 * Zod validation schema for user application role assignment
 * Provides runtime type checking with compile-time inference
 */
export const UserAppRoleSchema = z.object({
  id: z.string().min(1, 'Assignment ID is required'),
  appId: z.number().int().positive('Valid application ID is required'),
  roleId: z.number().int().positive('Valid role ID is required'),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
}).refine(data => {
  // Custom validation: Ensure app and role combination is valid
  return data.appId !== data.roleId; // Apps and roles have different ID spaces
}, {
  message: 'Invalid application and role combination',
  path: ['appId', 'roleId'],
});

/**
 * Zod validation schema for the complete form data
 */
export const UserAppRolesFormSchema = z.object({
  userAppRoles: z.array(UserAppRoleSchema).min(0).max(50, 'Maximum 50 role assignments allowed'),
  userId: z.number().int().positive().optional(),
  settings: z.object({
    autoActivate: z.boolean().default(true),
    inheritPermissions: z.boolean().default(false),
    defaultNotes: z.string().optional(),
  }).optional(),
}).refine(data => {
  // Custom validation: Ensure no duplicate app-role combinations
  const combinations = new Set();
  for (const assignment of data.userAppRoles) {
    const combo = `${assignment.appId}-${assignment.roleId}`;
    if (combinations.has(combo)) {
      return false;
    }
    combinations.add(combo);
  }
  return true;
}, {
  message: 'Duplicate application-role assignments are not allowed',
  path: ['userAppRoles'],
});

/**
 * Custom validation rules for enhanced form validation
 */
export interface UserAppRoleValidationRules {
  /** Custom app selection validation */
  validateAppSelection?: (appId: number, existingAssignments: UserAppRole[]) => boolean | string;
  
  /** Custom role selection validation */
  validateRoleSelection?: (roleId: number, appId: number, existingAssignments: UserAppRole[]) => boolean | string;
  
  /** Custom assignment limit validation */
  validateAssignmentLimit?: (assignments: UserAppRole[]) => boolean | string;
  
  /** Custom duplicate detection */
  validateDuplicates?: (assignments: UserAppRole[]) => boolean | string;
  
  /** Custom business rules validation */
  validateBusinessRules?: (assignments: UserAppRole[]) => ValidationResult[];
}

/**
 * Validation result structure for custom validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Error message if validation failed */
  message?: string;
  /** Field path for error targeting */
  field?: string;
  /** Severity level */
  severity?: 'error' | 'warning' | 'info';
}

// ============================================================================
// Accessibility Configuration (WCAG 2.1 AA Compliance)
// ============================================================================

/**
 * Comprehensive accessibility configuration for WCAG 2.1 AA compliance
 * Includes ARIA attributes, keyboard navigation, and screen reader support
 */
export interface UserAppRoleAccessibilityConfig {
  /** Main component label for screen readers */
  mainLabel?: string;
  
  /** Component description for assistive technologies */
  description?: string;
  
  /** Instructions for component usage */
  instructions?: string;
  
  /** Keyboard navigation configuration */
  keyboardNavigation?: {
    /** Whether keyboard navigation is enabled */
    enabled: boolean;
    /** Custom keyboard shortcuts */
    shortcuts?: KeyboardShortcuts;
    /** Focus management configuration */
    focusManagement?: FocusManagement;
  };
  
  /** Screen reader configuration */
  screenReader?: {
    /** Live region announcements */
    announcements?: ScreenReaderAnnouncements;
    /** Content labeling strategies */
    labeling?: ScreenReaderLabeling;
  };
  
  /** High contrast mode support */
  highContrast?: {
    /** Whether high contrast is supported */
    enabled: boolean;
    /** High contrast theme overrides */
    themeOverrides?: Record<string, string>;
  };
  
  /** Touch target configuration for mobile accessibility */
  touchTargets?: {
    /** Minimum touch target size (44px WCAG requirement) */
    minimumSize: number;
    /** Touch target spacing */
    spacing: number;
  };
  
  /** Error handling accessibility */
  errorHandling?: {
    /** How errors are announced */
    errorAnnouncement?: 'polite' | 'assertive' | 'off';
    /** Error message association strategy */
    errorAssociation?: 'aria-describedby' | 'aria-errormessage';
    /** Error summary configuration */
    errorSummary?: boolean;
  };
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcuts {
  /** Add new assignment shortcut */
  addAssignment?: string;
  /** Remove assignment shortcut */
  removeAssignment?: string;
  /** Toggle assignment status shortcut */
  toggleStatus?: string;
  /** Navigate to next assignment */
  nextAssignment?: string;
  /** Navigate to previous assignment */
  previousAssignment?: string;
  /** Save assignments shortcut */
  saveAssignments?: string;
}

/**
 * Focus management configuration
 */
export interface FocusManagement {
  /** Whether to trap focus within the component */
  trapFocus?: boolean;
  /** Initial focus target */
  initialFocus?: 'first' | 'last' | 'add-button' | 'none';
  /** Focus restoration after operations */
  restoreFocus?: boolean;
  /** Focus visible indicators */
  focusVisible?: boolean;
}

/**
 * Screen reader announcement configuration
 */
export interface ScreenReaderAnnouncements {
  /** Announcement when assignments are added */
  onAdd?: string;
  /** Announcement when assignments are removed */
  onRemove?: string;
  /** Announcement when validation errors occur */
  onError?: string;
  /** Announcement when assignments are saved */
  onSave?: string;
  /** Announcement for status changes */
  onStatusChange?: string;
}

/**
 * Screen reader labeling configuration
 */
export interface ScreenReaderLabeling {
  /** Label strategy for assignment items */
  assignmentLabel?: (assignment: UserAppRole, index: number) => string;
  /** Label strategy for app selection */
  appSelectionLabel?: (app: AppType) => string;
  /** Label strategy for role selection */
  roleSelectionLabel?: (role: RoleType) => string;
  /** Label strategy for control buttons */
  buttonLabels?: Record<string, string>;
}

// ============================================================================
// Theme and Styling Configuration
// ============================================================================

/**
 * Theme configuration for Tailwind CSS integration and dark mode support
 * Integrates with Zustand store for consistent theming
 */
export interface UserAppRoleThemeConfig {
  /** Color scheme preference */
  colorScheme?: 'light' | 'dark' | 'auto';
  
  /** Component variant styling */
  variants?: {
    /** Default variant styles */
    default?: UserAppRoleVariantStyles;
    /** Compact variant styles */
    compact?: UserAppRoleVariantStyles;
    /** Full variant styles */
    full?: UserAppRoleVariantStyles;
  };
  
  /** Component size styling */
  sizes?: {
    /** Small size styles */
    sm?: UserAppRoleSizeStyles;
    /** Medium size styles */
    md?: UserAppRoleSizeStyles;
    /** Large size styles */
    lg?: UserAppRoleSizeStyles;
  };
  
  /** State-based styling */
  states?: {
    /** Default state styles */
    default?: string;
    /** Loading state styles */
    loading?: string;
    /** Error state styles */
    error?: string;
    /** Disabled state styles */
    disabled?: string;
    /** Focus state styles */
    focused?: string;
  };
  
  /** Custom CSS classes */
  customClasses?: UserAppRoleCustomClasses;
  
  /** Animation configuration */
  animations?: UserAppRoleAnimationConfig;
}

/**
 * Variant-specific styling configuration
 */
export interface UserAppRoleVariantStyles {
  /** Container styles */
  container?: string;
  /** Assignment item styles */
  assignmentItem?: string;
  /** Add button styles */
  addButton?: string;
  /** Remove button styles */
  removeButton?: string;
  /** Form field styles */
  formField?: string;
  /** Label styles */
  label?: string;
}

/**
 * Size-specific styling configuration
 */
export interface UserAppRoleSizeStyles {
  /** Container padding and spacing */
  spacing?: string;
  /** Typography scale */
  typography?: string;
  /** Button sizes */
  buttons?: string;
  /** Form field sizes */
  fields?: string;
  /** Icon sizes */
  icons?: string;
}

/**
 * Custom CSS classes for component elements
 */
export interface UserAppRoleCustomClasses {
  /** Root container class */
  root?: string;
  /** Assignment list container class */
  assignmentList?: string;
  /** Individual assignment item class */
  assignmentItem?: string;
  /** App selection field class */
  appSelection?: string;
  /** Role selection field class */
  roleSelection?: string;
  /** Status toggle class */
  statusToggle?: string;
  /** Notes field class */
  notesField?: string;
  /** Action buttons container class */
  actionButtons?: string;
  /** Add button class */
  addButton?: string;
  /** Remove button class */
  removeButton?: string;
  /** Error message class */
  errorMessage?: string;
  /** Loading indicator class */
  loadingIndicator?: string;
}

/**
 * Animation configuration for component interactions
 */
export interface UserAppRoleAnimationConfig {
  /** Whether animations are enabled */
  enabled?: boolean;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation easing function */
  easing?: string;
  /** Specific animation configurations */
  animations?: {
    /** Add assignment animation */
    add?: AnimationSettings;
    /** Remove assignment animation */
    remove?: AnimationSettings;
    /** Form field changes animation */
    change?: AnimationSettings;
    /** Error state animation */
    error?: AnimationSettings;
  };
}

/**
 * Individual animation settings
 */
export interface AnimationSettings {
  /** Animation type */
  type?: 'fade' | 'slide' | 'scale' | 'bounce' | 'none';
  /** Animation duration */
  duration?: number;
  /** Animation delay */
  delay?: number;
  /** Animation easing */
  easing?: string;
}

// ============================================================================
// Internationalization Configuration (Next.js i18n)
// ============================================================================

/**
 * Internationalization configuration for Next.js i18n integration
 * Supports dynamic content translation and locale-specific formatting
 */
export interface UserAppRoleI18nConfig {
  /** Current locale */
  locale?: string;
  
  /** Supported locales */
  supportedLocales?: string[];
  
  /** Text translations */
  translations?: UserAppRoleTranslations;
  
  /** Locale-specific formatting */
  formatting?: {
    /** Date formatting */
    dateFormat?: string;
    /** Time formatting */
    timeFormat?: string;
    /** Number formatting */
    numberFormat?: Intl.NumberFormatOptions;
  };
  
  /** Text direction support */
  textDirection?: 'ltr' | 'rtl' | 'auto';
  
  /** Pluralization rules */
  pluralization?: {
    /** Pluralization function */
    pluralize?: (count: number, translations: Record<string, string>) => string;
  };
}

/**
 * Text translations for all component strings
 */
export interface UserAppRoleTranslations {
  /** Component labels */
  labels?: {
    title?: string;
    subtitle?: string;
    assignmentLabel?: string;
    appSelectionLabel?: string;
    roleSelectionLabel?: string;
    statusLabel?: string;
    notesLabel?: string;
    actionsLabel?: string;
  };
  
  /** Button text */
  buttons?: {
    add?: string;
    remove?: string;
    save?: string;
    cancel?: string;
    clear?: string;
    reset?: string;
  };
  
  /** Placeholder text */
  placeholders?: {
    selectApp?: string;
    selectRole?: string;
    enterNotes?: string;
    searchApps?: string;
    searchRoles?: string;
  };
  
  /** Validation messages */
  validation?: {
    required?: string;
    duplicate?: string;
    maxAssignments?: string;
    minAssignments?: string;
    invalidCombination?: string;
  };
  
  /** Status messages */
  status?: {
    loading?: string;
    saving?: string;
    saved?: string;
    error?: string;
    empty?: string;
    noAppsAvailable?: string;
    noRolesAvailable?: string;
  };
  
  /** Accessibility text */
  accessibility?: {
    instructions?: string;
    addButtonAria?: string;
    removeButtonAria?: string;
    assignmentAria?: string;
    statusToggleAria?: string;
  };
  
  /** Confirmation messages */
  confirmations?: {
    removeAssignment?: string;
    clearAssignments?: string;
    resetForm?: string;
  };
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Comprehensive event handler types for component interactions
 * Supports both controlled and uncontrolled component modes
 */
export interface UserAppRoleEventHandlers {
  /** Assignment lifecycle events */
  onAssignmentAdd?: (assignment: UserAppRole, index: number) => void | Promise<void>;
  onAssignmentRemove?: (assignmentId: string, index: number) => void | Promise<void>;
  onAssignmentUpdate?: (assignment: UserAppRole, index: number) => void | Promise<void>;
  onAssignmentReorder?: (fromIndex: number, toIndex: number) => void | Promise<void>;
  
  /** Selection events */
  onAppSelect?: (appId: number, assignment: UserAppRole, index: number) => void | Promise<void>;
  onRoleSelect?: (roleId: number, assignment: UserAppRole, index: number) => void | Promise<void>;
  onStatusToggle?: (isActive: boolean, assignment: UserAppRole, index: number) => void | Promise<void>;
  
  /** Form events */
  onFormChange?: (assignments: UserAppRole[]) => void | Promise<void>;
  onFormSubmit?: (data: UserAppRolesFormData) => void | Promise<void>;
  onFormReset?: () => void | Promise<void>;
  onFormValidation?: (isValid: boolean, errors: FieldErrors<UserAppRolesFormData>) => void;
  
  /** User interaction events */
  onFocus?: (assignmentId: string, fieldName: string) => void;
  onBlur?: (assignmentId: string, fieldName: string) => void;
  onClick?: (event: React.MouseEvent, assignmentId?: string) => void;
  onKeyDown?: (event: React.KeyboardEvent, assignmentId?: string) => void;
  
  /** Data loading events */
  onAppsLoad?: (apps: AppType[]) => void;
  onRolesLoad?: (roles: RoleType[]) => void;
  onLoadingStateChange?: (loading: boolean) => void;
  onError?: (error: Error | string) => void;
}

// ============================================================================
// Integration Types for Parent Form Communication
// ============================================================================

/**
 * Integration interface for seamless parent form communication
 * Enables field value propagation and validation synchronization
 */
export interface UserAppRoleFormIntegration {
  /** Parent form field name */
  parentFieldName?: string;
  
  /** Value transformation functions */
  valueTransform?: {
    /** Transform internal values to parent form format */
    toParent?: (assignments: UserAppRole[]) => any;
    /** Transform parent form values to internal format */
    fromParent?: (value: any) => UserAppRole[];
  };
  
  /** Validation synchronization */
  validationSync?: {
    /** Whether to sync validation with parent form */
    enabled?: boolean;
    /** Custom validation sync function */
    syncFunction?: (errors: FieldErrors<UserAppRolesFormData>) => any;
  };
  
  /** State synchronization */
  stateSync?: {
    /** Whether to sync loading state with parent */
    loading?: boolean;
    /** Whether to sync error state with parent */
    errors?: boolean;
    /** Whether to sync dirty state with parent */
    dirty?: boolean;
  };
  
  /** Custom integration hooks */
  hooks?: {
    /** Hook called before value propagation */
    beforePropagate?: (assignments: UserAppRole[]) => UserAppRole[] | Promise<UserAppRole[]>;
    /** Hook called after value propagation */
    afterPropagate?: (assignments: UserAppRole[]) => void | Promise<void>;
    /** Hook called on validation errors */
    onValidationError?: (errors: FieldErrors<UserAppRolesFormData>) => void;
  };
}

// ============================================================================
// Testing Configuration Types
// ============================================================================

/**
 * Testing configuration for component test utilities
 * Supports unit testing, integration testing, and accessibility testing
 */
export interface UserAppRoleTestConfig {
  /** Test ID prefix for component elements */
  testIdPrefix?: string;
  
  /** Mock data configuration */
  mockData?: {
    /** Mock applications */
    apps?: AppType[];
    /** Mock roles */
    roles?: RoleType[];
    /** Mock assignments */
    assignments?: UserAppRole[];
  };
  
  /** Testing utilities configuration */
  testUtils?: {
    /** Whether to enable test utilities */
    enabled?: boolean;
    /** Custom test utilities */
    customUtils?: Record<string, any>;
  };
  
  /** Accessibility testing configuration */
  a11yTesting?: {
    /** Whether to enable accessibility testing */
    enabled?: boolean;
    /** Accessibility testing rules */
    rules?: string[];
  };
  
  /** Performance testing configuration */
  performanceTesting?: {
    /** Whether to enable performance testing */
    enabled?: boolean;
    /** Performance thresholds */
    thresholds?: {
      /** Render time threshold in milliseconds */
      renderTime?: number;
      /** Interaction response time threshold */
      interactionTime?: number;
    };
  };
}

// ============================================================================
// Hook Integration Types
// ============================================================================

/**
 * Custom hook return type for user application roles management
 * Provides comprehensive state management and operations
 */
export interface UseUserAppRolesReturn {
  /** Current assignments */
  assignments: UserAppRole[];
  
  /** Assignment management operations */
  operations: {
    /** Add new assignment */
    addAssignment: (appId: number, roleId: number, options?: Partial<UserAppRole>) => void;
    /** Remove assignment by ID */
    removeAssignment: (assignmentId: string) => void;
    /** Update existing assignment */
    updateAssignment: (assignmentId: string, updates: Partial<UserAppRole>) => void;
    /** Reorder assignments */
    reorderAssignments: (fromIndex: number, toIndex: number) => void;
    /** Clear all assignments */
    clearAssignments: () => void;
    /** Reset to initial state */
    resetAssignments: () => void;
  };
  
  /** Validation state */
  validation: {
    /** Whether the form is valid */
    isValid: boolean;
    /** Validation errors */
    errors: FieldErrors<UserAppRolesFormData>;
    /** Validate all assignments */
    validateAll: () => boolean;
    /** Validate specific assignment */
    validateAssignment: (assignmentId: string) => boolean;
  };
  
  /** Component state */
  state: {
    /** Whether the component is loading */
    loading: boolean;
    /** Whether the form is dirty */
    dirty: boolean;
    /** Whether the form is submitting */
    submitting: boolean;
    /** Component error state */
    error: string | null;
  };
  
  /** Utility functions */
  utils: {
    /** Get assignment by ID */
    getAssignment: (assignmentId: string) => UserAppRole | undefined;
    /** Check if assignment exists */
    hasAssignment: (appId: number, roleId: number) => boolean;
    /** Get assignments for specific app */
    getAssignmentsByApp: (appId: number) => UserAppRole[];
    /** Get assignments for specific role */
    getAssignmentsByRole: (roleId: number) => UserAppRole[];
  };
}

/**
 * Hook configuration for user application roles management
 */
export interface UseUserAppRolesConfig {
  /** Initial assignments */
  initialAssignments?: UserAppRole[];
  
  /** Available applications */
  availableApps?: AppType[];
  
  /** Available roles */
  availableRoles?: RoleType[];
  
  /** Validation configuration */
  validation?: {
    /** Whether to validate on change */
    validateOnChange?: boolean;
    /** Whether to validate on blur */
    validateOnBlur?: boolean;
    /** Custom validation rules */
    customRules?: UserAppRoleValidationRules;
  };
  
  /** Auto-save configuration */
  autoSave?: {
    /** Whether auto-save is enabled */
    enabled?: boolean;
    /** Auto-save delay in milliseconds */
    delay?: number;
    /** Auto-save function */
    saveFunction?: (assignments: UserAppRole[]) => Promise<void>;
  };
  
  /** Event handlers */
  eventHandlers?: UserAppRoleEventHandlers;
}

// ============================================================================
// Utility Types and Type Guards
// ============================================================================

/**
 * Type utility for extracting form field paths
 */
export type UserAppRoleFieldPath = FieldPath<UserAppRolesFormData>;

/**
 * Type utility for form field values
 */
export type UserAppRoleFieldValue<T extends UserAppRoleFieldPath> = PathValue<UserAppRolesFormData, T>;

/**
 * Type guard to check if an object is a valid UserAppRole
 */
export function isUserAppRole(obj: any): obj is UserAppRole {
  try {
    UserAppRoleSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard to check if form data is valid
 */
export function isValidUserAppRolesFormData(obj: any): obj is UserAppRolesFormData {
  try {
    UserAppRolesFormSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
}

/**
 * Utility type for component ref
 */
export interface UserAppRolesRef {
  /** Focus the component */
  focus: () => void;
  /** Validate the form */
  validate: () => boolean;
  /** Submit the form */
  submit: () => void;
  /** Reset the form */
  reset: () => void;
  /** Get current form values */
  getValues: () => UserAppRolesFormData;
  /** Set form values */
  setValues: (values: Partial<UserAppRolesFormData>) => void;
}

// ============================================================================
// Extended Component Props with Ref Support
// ============================================================================

/**
 * Extended component props with ref support
 */
export interface UserAppRolesWithRefProps extends UserAppRolesProps {
  /** Component ref */
  ref?: React.Ref<UserAppRolesRef>;
}

// ============================================================================
// Default Export Interface
// ============================================================================

/**
 * Main export interface combining all types for convenience
 */
export interface UserAppRolesTypes {
  // Core types
  UserAppRole: UserAppRole;
  UserAppRolesFormData: UserAppRolesFormData;
  UserAppRolesProps: UserAppRolesProps;
  
  // Configuration types
  UserAppRoleAccessibilityConfig: UserAppRoleAccessibilityConfig;
  UserAppRoleThemeConfig: UserAppRoleThemeConfig;
  UserAppRoleI18nConfig: UserAppRoleI18nConfig;
  
  // Validation types
  UserAppRoleValidationRules: UserAppRoleValidationRules;
  ValidationResult: ValidationResult;
  
  // Integration types
  UserAppRoleFormIntegration: UserAppRoleFormIntegration;
  UserAppRoleEventHandlers: UserAppRoleEventHandlers;
  
  // Hook types
  UseUserAppRolesReturn: UseUserAppRolesReturn;
  UseUserAppRolesConfig: UseUserAppRolesConfig;
  
  // Utility types
  UserAppRolesRef: UserAppRolesRef;
  
  // Schemas
  UserAppRoleSchema: typeof UserAppRoleSchema;
  UserAppRolesFormSchema: typeof UserAppRolesFormSchema;
}

// ============================================================================
// Type Exports for External Use
// ============================================================================

export type {
  // Re-export for convenience
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFieldArrayReturn,
  AppType,
  RoleType,
  SelectOption,
};

// Default export
export default UserAppRolesTypes;