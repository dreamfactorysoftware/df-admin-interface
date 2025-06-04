/**
 * @fileoverview Barrel export file for all React UI components
 * 
 * Provides centralized imports for DreamFactory Admin Interface UI components.
 * Enables clean imports like `import { Alert, Button, Dialog } from '@/components/ui'`
 * with full TypeScript support and tree-shaking optimization.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// =============================================================================
// FORM COMPONENTS
// =============================================================================

// Basic form elements
export { Button } from './button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './button';

export { Input } from './input';
export type { InputProps, InputType } from './input';

export { Select } from './select';
export type { SelectProps, SelectOption } from './select';

export { Toggle } from './toggle';
export type { ToggleProps } from './toggle';

export { Form } from './form';
export type { FormProps, FormField, FormSchema } from './form';

// Advanced form components
export { DynamicField } from './dynamic-field';
export type { DynamicFieldProps, FieldType } from './dynamic-field';

export { FieldArray } from './field-array';
export type { FieldArrayProps } from './field-array';

export { VerbPicker } from './verb-picker';
export type { VerbPickerProps, HttpVerb } from './verb-picker';

export { LookupKeys } from './lookup-keys';
export type { LookupKeysProps, LookupKey } from './lookup-keys';

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================

// Navigation and layout
export { Navigation } from './navigation';
export type { NavigationProps, NavigationItem } from './navigation';

export { ThemeToggle } from './theme-toggle';
export type { ThemeToggleProps } from './theme-toggle';

// Data display
export { ManageTable } from './manage-table';
export type { 
  ManageTableProps, 
  TableColumn, 
  TableConfig,
  PaginationConfig,
  FilterConfig 
} from './manage-table';

// =============================================================================
// FEEDBACK COMPONENTS
// =============================================================================

// Notifications and alerts
export { Alert } from './alert';
export type { AlertProps, AlertVariant, AlertSize } from './alert';

export { Snackbar } from './snackbar';
export type { SnackbarProps, SnackbarPosition } from './snackbar';

// Loading and status
export { Paywall } from './paywall';
export type { PaywallProps } from './paywall';

export { LicenseExpired } from './license-expired';
export type { LicenseExpiredProps } from './license-expired';

// =============================================================================
// DIALOG COMPONENTS
// =============================================================================

// Modal dialogs
export { Dialog } from './dialog';
export type { DialogProps, DialogSize } from './dialog';

export { ConfirmDialog } from './confirm-dialog';
export type { ConfirmDialogProps, ConfirmDialogType } from './confirm-dialog';

export { Popup } from './popup';
export type { PopupProps, PopupPosition } from './popup';

export { SearchDialog } from './search-dialog';
export type { SearchDialogProps, SearchResult } from './search-dialog';

export { ScriptsGithubDialog } from './scripts-github-dialog';
export type { ScriptsGithubDialogProps } from './scripts-github-dialog';

// =============================================================================
// EDITOR COMPONENTS
// =============================================================================

// Code and text editors
export { AceEditor } from './ace-editor';
export type { AceEditorProps, AceMode, AceTheme } from './ace-editor';

export { ScriptEditor } from './script-editor';
export type { ScriptEditorProps, ScriptLanguage } from './script-editor';

// =============================================================================
// FILE COMPONENTS
// =============================================================================

// File handling
export { FileSelector } from './file-selector';
export type { FileSelectorProps, FileType } from './file-selector';

export { FileGithub } from './file-github';
export type { FileGithubProps, GithubFile } from './file-github';

// =============================================================================
// USER COMPONENTS
// =============================================================================

// User management
export { UserDetails } from './user-details';
export type { UserDetailsProps, UserProfile } from './user-details';

export { UserAppRoles } from './user-app-roles';
export type { UserAppRolesProps, AppRole } from './user-app-roles';

export { ProfileDetails } from './profile-details';
export type { ProfileDetailsProps } from './profile-details';

// =============================================================================
// SERVICE COMPONENTS
// =============================================================================

// Service integration
export { LinkService } from './link-service';
export type { LinkServiceProps, ServiceConnection } from './link-service';

// =============================================================================
// COMMON UI TYPES AND UTILITIES
// =============================================================================

// Base component types
export type { 
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  FormFieldComponent 
} from '../../types/ui';

// Theme and styling types
export type {
  ThemeMode,
  ColorScheme,
  SpacingSize,
  BorderRadius,
  Elevation
} from '../../types/ui';

// Accessibility types
export type {
  AriaProps,
  KeyboardNavigationProps,
  FocusManagementProps
} from '../../types/ui';

// Responsive design types
export type {
  BreakpointConfig,
  ResponsiveValue,
  ViewportSize
} from '../../types/ui';

// Animation and interaction types
export type {
  AnimationConfig,
  TransitionProps,
  InteractionState
} from '../../types/ui';

// Data and state types
export type {
  LoadingState,
  ErrorState,
  ValidationState,
  AsyncState
} from '../../types/ui';

// Form and validation types
export type {
  FormValidation,
  FieldValidation,
  ValidationMode,
  ValidationError
} from '../../types/ui';

// Table and data display types
export type {
  SortConfig,
  TableState,
  ColumnDefinition,
  DataGridProps
} from '../../types/ui';

// Layout and positioning types
export type {
  LayoutConfig,
  GridConfig,
  FlexConfig,
  PositionConfig
} from '../../types/ui';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

// Component utility functions
export { cn } from '../../lib/utils';
export { createVariants } from '../../lib/utils';

// Theme utilities
export { getThemeClass } from '../../lib/utils';
export { generateColorPalette } from '../../lib/utils';

// Accessibility utilities
export { generateAriaProps } from '../../lib/utils';
export { createKeyboardHandler } from '../../lib/utils';

// Responsive utilities
export { getBreakpointValue } from '../../lib/utils';
export { createResponsiveProps } from '../../lib/utils';

// =============================================================================
// COMPONENT CONSTANTS
// =============================================================================

// Size variants
export const COMPONENT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

// Color variants
export const COMPONENT_VARIANTS = [
  'primary',
  'secondary', 
  'success',
  'warning',
  'error',
  'ghost',
  'outline'
] as const;

// Animation durations
export const ANIMATION_DURATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms'
} as const;

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const;

// Z-index layers
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070
} as const;

// =============================================================================
// TYPE GUARDS AND VALIDATORS
// =============================================================================

/**
 * Type guard to check if a value is a valid component size
 */
export const isValidSize = (size: unknown): size is ComponentSize => {
  return typeof size === 'string' && COMPONENT_SIZES.includes(size as ComponentSize);
};

/**
 * Type guard to check if a value is a valid component variant
 */
export const isValidVariant = (variant: unknown): variant is ComponentVariant => {
  return typeof variant === 'string' && COMPONENT_VARIANTS.includes(variant as ComponentVariant);
};

/**
 * Validates component props for common patterns
 */
export const validateComponentProps = <T extends BaseComponent>(props: T): boolean => {
  if (props.size && !isValidSize(props.size)) return false;
  if (props.variant && !isValidVariant(props.variant)) return false;
  return true;
};

// =============================================================================
// EXPORTS FOR COMPONENT COMPOSITION
// =============================================================================

// Re-export common React types for convenience
export type { 
  ReactNode, 
  ReactElement, 
  ComponentType, 
  FC, 
  PropsWithChildren 
} from 'react';

// Re-export common form types
export type { 
  FieldPath, 
  FieldValues, 
  Control, 
  UseFormRegister 
} from 'react-hook-form';

// Re-export common Next.js types
export type { 
  NextPage, 
  GetServerSideProps, 
  GetStaticProps 
} from 'next';