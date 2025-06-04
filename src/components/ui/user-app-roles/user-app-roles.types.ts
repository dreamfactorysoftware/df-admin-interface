/**
 * @fileoverview TypeScript type definitions for the React user application roles component
 * 
 * This file defines comprehensive interfaces for the UserAppRoles component that supports
 * React Hook Form integration, WCAG 2.1 AA accessibility compliance, and seamless
 * integration with the broader DreamFactory admin interface architecture.
 * 
 * Key Features:
 * - React Hook Form useFieldArray integration with proper field registration
 * - WCAG 2.1 AA accessibility attributes and ARIA support
 * - Backward compatibility with existing AppType and RoleType interfaces
 * - Zod validation schema compatibility for type-safe form validation
 * - Theme integration with Zustand store for dark mode support
 * - Internationalization patterns for Next.js i18n integration
 * - Support for both controlled and uncontrolled component modes
 * 
 * @version 1.0.0
 * @author DreamFactory Platform Team
 */

import { ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { 
  Control, 
  FieldError, 
  FieldValues, 
  FieldPath, 
  UseFieldArrayReturn,
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
  UseFormTrigger
} from 'react-hook-form';
import { z } from 'zod';

// =============================================================================
// CORE TYPE DEFINITIONS
// =============================================================================

/**
 * Application interface compatible with existing DreamFactory AppType
 * Maintains backward compatibility while adding React-specific enhancements
 */
export interface AppType {
  /** Unique application identifier */
  id: number;
  /** Application name for display and reference */
  name: string;
  /** Human-readable application label */
  label?: string;
  /** Application description */
  description?: string;
  /** Whether application is active and available for assignment */
  is_active: boolean;
  /** Application type categorization */
  type?: string;
  /** Launch URL for web applications */
  launch_url?: string;
  /** API documentation URL */
  doc_url?: string;
  /** Application icon/logo URL */
  icon_url?: string;
  /** Creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** Creator user ID */
  created_by_id?: number;
  /** Last modifier user ID */
  last_modified_by_id?: number;
}

/**
 * Role interface compatible with existing DreamFactory RoleType
 * Enhanced with accessibility and display properties
 */
export interface RoleType {
  /** Unique role identifier */
  id: number;
  /** Role name for system reference */
  name: string;
  /** Human-readable role label */
  label?: string;
  /** Role description */
  description?: string;
  /** Whether role is active and assignable */
  is_active: boolean;
  /** Default role flag */
  is_default?: boolean;
  /** Role service access permissions */
  role_service_access?: RoleServiceAccess[];
  /** Creation timestamp */
  created_date?: string;
  /** Last modification timestamp */
  last_modified_date?: string;
  /** Creator user ID */
  created_by_id?: number;
  /** Last modifier user ID */
  last_modified_by_id?: number;
}

/**
 * Role service access permission definition
 */
export interface RoleServiceAccess {
  /** Service ID */
  service_id: number;
  /** Component access level */
  component?: string;
  /** Allowed HTTP verbs */
  verb_mask: number;
  /** Additional access parameters */
  requestor_type?: string;
  /** Filters and conditions */
  filters?: string;
  /** Filter operator */
  filter_op?: 'AND' | 'OR';
  /** Advanced permissions */
  advanced?: Record<string, any>;
}

/**
 * Application-Role assignment interface for form data
 * Represents the relationship between applications and roles in the user context
 */
export interface UserAppRoleAssignment {
  /** Unique assignment identifier (optional for new assignments) */
  id?: number;
  /** Application reference */
  app: AppType;
  /** Assigned role for this application */
  role: RoleType;
  /** Whether this assignment is active */
  is_active: boolean;
  /** Additional assignment metadata */
  metadata?: Record<string, any>;
}

// =============================================================================
// FORM INTEGRATION TYPES
// =============================================================================

/**
 * Form data structure for React Hook Form integration
 * Designed to work seamlessly with useFieldArray hook
 */
export interface UserAppRolesFormData {
  /** Array of application-role assignments managed by useFieldArray */
  appRoles: UserAppRoleAssignment[];
}

/**
 * Field registration interface for React Hook Form compatibility
 * Provides type-safe field registration with proper validation
 */
export interface AppRoleFieldRegistration<TFormData extends FieldValues = UserAppRolesFormData> {
  /** Form control instance from useForm */
  control: Control<TFormData>;
  /** Field registration function */
  register: UseFormRegister<TFormData>;
  /** Form watch function for reactive updates */
  watch: UseFormWatch<TFormData>;
  /** Field value setter for programmatic updates */
  setValue: UseFormSetValue<TFormData>;
  /** Field validation trigger */
  trigger: UseFormTrigger<TFormData>;
  /** Field array operations from useFieldArray */
  fieldArray: UseFieldArrayReturn<TFormData, FieldPath<TFormData>>;
}

// =============================================================================
// VALIDATION SCHEMA TYPES
// =============================================================================

/**
 * Zod schema type for user app roles validation
 * Ensures type safety and runtime validation
 */
export const UserAppRoleAssignmentSchema = z.object({
  id: z.number().optional(),
  app: z.object({
    id: z.number().positive('Application ID must be positive'),
    name: z.string().min(1, 'Application name is required'),
    label: z.string().optional(),
    description: z.string().optional(),
    is_active: z.boolean(),
    type: z.string().optional(),
    launch_url: z.string().url().optional().or(z.literal('')),
    doc_url: z.string().url().optional().or(z.literal('')),
    icon_url: z.string().url().optional().or(z.literal('')),
    created_date: z.string().optional(),
    last_modified_date: z.string().optional(),
    created_by_id: z.number().optional(),
    last_modified_by_id: z.number().optional(),
  }),
  role: z.object({
    id: z.number().positive('Role ID must be positive'),
    name: z.string().min(1, 'Role name is required'),
    label: z.string().optional(),
    description: z.string().optional(),
    is_active: z.boolean(),
    is_default: z.boolean().optional(),
    role_service_access: z.array(z.object({
      service_id: z.number(),
      component: z.string().optional(),
      verb_mask: z.number(),
      requestor_type: z.string().optional(),
      filters: z.string().optional(),
      filter_op: z.enum(['AND', 'OR']).optional(),
      advanced: z.record(z.any()).optional(),
    })).optional(),
    created_date: z.string().optional(),
    last_modified_date: z.string().optional(),
    created_by_id: z.number().optional(),
    last_modified_by_id: z.number().optional(),
  }),
  is_active: z.boolean(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Zod schema for the complete form data
 */
export const UserAppRolesFormSchema = z.object({
  appRoles: z.array(UserAppRoleAssignmentSchema),
});

/**
 * Type inference from Zod schemas
 */
export type UserAppRoleAssignmentValidation = z.infer<typeof UserAppRoleAssignmentSchema>;
export type UserAppRolesFormValidation = z.infer<typeof UserAppRolesFormSchema>;

/**
 * Validation error structure for form feedback
 */
export interface ValidationErrors {
  /** Field-specific validation errors */
  fieldErrors: Record<string, string[]>;
  /** Form-level validation errors */
  formErrors: string[];
  /** Internationalized error messages */
  localizedErrors: Record<string, string>;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

/**
 * Theme configuration for consistent styling
 * Integrates with Zustand store for dark mode support
 */
export interface ThemeConfiguration {
  /** Current theme mode */
  mode: 'light' | 'dark' | 'auto';
  /** Custom theme variables */
  customProperties?: Record<string, string>;
  /** Accessibility high contrast mode */
  highContrast?: boolean;
  /** Reduced motion preference */
  reducedMotion?: boolean;
}

/**
 * Accessibility properties for WCAG 2.1 AA compliance
 * Comprehensive ARIA attributes and keyboard navigation support
 */
export interface AccessibilityProps {
  /** ARIA label for the component */
  'aria-label'?: string;
  /** ARIA description reference */
  'aria-describedby'?: string;
  /** ARIA label reference */
  'aria-labelledby'?: string;
  /** Whether component is required */
  'aria-required'?: boolean;
  /** Invalid state indicator */
  'aria-invalid'?: boolean;
  /** Expanded state for collapsible content */
  'aria-expanded'?: boolean;
  /** Live region for dynamic updates */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Role override */
  role?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Keyboard event handlers */
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;
  /** Focus management */
  autoFocus?: boolean;
}

/**
 * Internationalization support for Next.js i18n integration
 */
export interface InternationalizationProps {
  /** Current locale */
  locale?: string;
  /** Translation namespace */
  namespace?: string;
  /** Fallback locale */
  fallbackLocale?: string;
  /** Direction for RTL support */
  direction?: 'ltr' | 'rtl';
  /** Custom translation keys */
  translationKeys?: Record<string, string>;
}

/**
 * Event handler types for component interactions
 * Supports both controlled and uncontrolled modes
 */
export interface EventHandlers {
  /** Application selection change handler */
  onAppChange?: (appId: number, assignment: UserAppRoleAssignment) => void;
  /** Role selection change handler */
  onRoleChange?: (roleId: number, assignment: UserAppRoleAssignment) => void;
  /** Add new assignment handler */
  onAddAssignment?: () => void;
  /** Remove assignment handler */
  onRemoveAssignment?: (index: number, assignment: UserAppRoleAssignment) => void;
  /** Assignment activation toggle */
  onToggleActive?: (index: number, isActive: boolean) => void;
  /** Validation error handler */
  onValidationError?: (errors: ValidationErrors) => void;
  /** Form submission handler */
  onSubmit?: (data: UserAppRolesFormData) => void | Promise<void>;
  /** Generic change handler for parent form communication */
  onChange?: (assignments: UserAppRoleAssignment[]) => void;
}

/**
 * Data source configuration for applications and roles
 */
export interface DataSourceConfiguration {
  /** Available applications */
  applications: AppType[];
  /** Available roles */
  roles: RoleType[];
  /** Loading state for applications */
  applicationsLoading?: boolean;
  /** Loading state for roles */
  rolesLoading?: boolean;
  /** Error state for data loading */
  loadingError?: string;
  /** Data refresh handler */
  onRefresh?: () => void;
  /** Search/filter configuration */
  searchConfiguration?: SearchConfiguration;
}

/**
 * Search and filtering configuration
 */
export interface SearchConfiguration {
  /** Enable application search */
  enableAppSearch?: boolean;
  /** Enable role search */
  enableRoleSearch?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Custom search function */
  customSearchFunction?: (query: string, items: AppType[] | RoleType[]) => AppType[] | RoleType[];
  /** Debounce delay for search */
  searchDebounce?: number;
}

/**
 * Main component props interface
 * Comprehensive configuration for the UserAppRoles component
 */
export interface UserAppRolesProps<TFormData extends FieldValues = UserAppRolesFormData> 
  extends AccessibilityProps, 
          InternationalizationProps {
  // Core functionality
  /** Field name for form integration */
  name: FieldPath<TFormData>;
  /** Form field registration */
  fieldRegistration: AppRoleFieldRegistration<TFormData>;
  /** Data source configuration */
  dataSource: DataSourceConfiguration;
  
  // Component configuration
  /** Initial assignments data */
  defaultValue?: UserAppRoleAssignment[];
  /** Current value for controlled mode */
  value?: UserAppRoleAssignment[];
  /** Component disabled state */
  disabled?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** Maximum number of assignments allowed */
  maxAssignments?: number;
  /** Minimum number of assignments required */
  minAssignments?: number;
  
  // UI configuration
  /** Theme configuration */
  theme?: ThemeConfiguration;
  /** Component size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'compact' | 'detailed';
  /** Show assignment descriptions */
  showDescriptions?: boolean;
  /** Enable drag and drop reordering */
  enableReordering?: boolean;
  /** Custom CSS classes */
  className?: string;
  
  // Event handlers
  /** Event handler configuration */
  eventHandlers?: EventHandlers;
  
  // Validation
  /** Custom validation rules */
  customValidation?: (assignments: UserAppRoleAssignment[]) => ValidationErrors | null;
  /** Show validation errors inline */
  showInlineErrors?: boolean;
  /** Validation error display mode */
  errorDisplayMode?: 'tooltip' | 'inline' | 'summary';
  
  // Advanced features
  /** Custom component overrides */
  components?: {
    /** Custom application selector */
    AppSelector?: React.ComponentType<AppSelectorProps>;
    /** Custom role selector */
    RoleSelector?: React.ComponentType<RoleSelectorProps>;
    /** Custom assignment item renderer */
    AssignmentItem?: React.ComponentType<AssignmentItemProps>;
    /** Custom add button */
    AddButton?: React.ComponentType<AddButtonProps>;
    /** Custom remove button */
    RemoveButton?: React.ComponentType<RemoveButtonProps>;
  };
  
  // Testing and debugging
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Development mode helpers */
  debug?: boolean;
}

// =============================================================================
// COMPONENT-SPECIFIC INTERFACES
// =============================================================================

/**
 * Props for custom application selector component
 */
export interface AppSelectorProps {
  /** Available applications */
  applications: AppType[];
  /** Currently selected application */
  selectedApp?: AppType;
  /** Selection change handler */
  onAppSelect: (app: AppType) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Search configuration */
  searchConfig?: SearchConfiguration;
  /** Accessibility props */
  accessibilityProps?: AccessibilityProps;
}

/**
 * Props for custom role selector component
 */
export interface RoleSelectorProps {
  /** Available roles */
  roles: RoleType[];
  /** Currently selected role */
  selectedRole?: RoleType;
  /** Selection change handler */
  onRoleSelect: (role: RoleType) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Filter roles by application */
  filterByApp?: AppType;
  /** Search configuration */
  searchConfig?: SearchConfiguration;
  /** Accessibility props */
  accessibilityProps?: AccessibilityProps;
}

/**
 * Props for custom assignment item renderer
 */
export interface AssignmentItemProps {
  /** Assignment data */
  assignment: UserAppRoleAssignment;
  /** Item index in the list */
  index: number;
  /** Update handler */
  onUpdate: (updatedAssignment: UserAppRoleAssignment) => void;
  /** Remove handler */
  onRemove: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Show descriptions */
  showDescription?: boolean;
  /** Validation errors for this item */
  errors?: Record<string, string>;
  /** Theme configuration */
  theme?: ThemeConfiguration;
}

/**
 * Props for custom add button component
 */
export interface AddButtonProps {
  /** Add handler */
  onAdd: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button text override */
  text?: string;
  /** Icon override */
  icon?: ReactNode;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Props for custom remove button component
 */
export interface RemoveButtonProps {
  /** Remove handler */
  onRemove: () => void;
  /** Disabled state */
  disabled?: boolean;
  /** Button text override */
  text?: string;
  /** Icon override */
  icon?: ReactNode;
  /** Confirmation required */
  requireConfirmation?: boolean;
  /** Confirmation message */
  confirmationMessage?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Form mode discrimination for conditional behavior
 */
export type FormMode = 'create' | 'edit' | 'view';

/**
 * Component state type for internal state management
 */
export interface ComponentState {
  /** Current form mode */
  mode: FormMode;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Validation state */
  isValid: boolean;
  /** Dirty state */
  isDirty: boolean;
  /** Touched fields */
  touchedFields: Set<string>;
}

/**
 * Hook return type for useUserAppRoles custom hook
 */
export interface UseUserAppRolesReturn {
  /** Current assignments */
  assignments: UserAppRoleAssignment[];
  /** Add new assignment */
  addAssignment: (app: AppType, role: RoleType) => void;
  /** Remove assignment */
  removeAssignment: (index: number) => void;
  /** Update assignment */
  updateAssignment: (index: number, assignment: UserAppRoleAssignment) => void;
  /** Validation state */
  validationState: ValidationErrors | null;
  /** Component state */
  componentState: ComponentState;
  /** Reset to initial state */
  reset: () => void;
  /** Validate current data */
  validate: () => boolean;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if an object is a valid AppType
 */
export function isAppType(obj: any): obj is AppType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.is_active === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid RoleType
 */
export function isRoleType(obj: any): obj is RoleType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.is_active === 'boolean'
  );
}

/**
 * Type guard to check if an object is a valid UserAppRoleAssignment
 */
export function isUserAppRoleAssignment(obj: any): obj is UserAppRoleAssignment {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    isAppType(obj.app) &&
    isRoleType(obj.role) &&
    typeof obj.is_active === 'boolean'
  );
}

// =============================================================================
// EXPORT TYPES FOR EXTERNAL USE
// =============================================================================

export type {
  // Core types
  AppType,
  RoleType,
  UserAppRoleAssignment,
  UserAppRolesFormData,
  
  // Form integration
  AppRoleFieldRegistration,
  UserAppRoleAssignmentValidation,
  UserAppRolesFormValidation,
  ValidationErrors,
  
  // Component configuration
  ThemeConfiguration,
  AccessibilityProps,
  InternationalizationProps,
  EventHandlers,
  DataSourceConfiguration,
  SearchConfiguration,
  UserAppRolesProps,
  
  // Component-specific
  AppSelectorProps,
  RoleSelectorProps,
  AssignmentItemProps,
  AddButtonProps,
  RemoveButtonProps,
  
  // Utilities
  FormMode,
  ComponentState,
  UseUserAppRolesReturn,
};

// Export schemas for runtime validation
export {
  UserAppRoleAssignmentSchema,
  UserAppRolesFormSchema,
};

// Export type guards
export {
  isAppType,
  isRoleType,
  isUserAppRoleAssignment,
};