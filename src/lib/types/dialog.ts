/**
 * @fileoverview Core dialog types for React/Next.js dialog patterns and Headless UI integration
 * 
 * This file provides streamlined dialog interfaces adapted for React dialog patterns,
 * replacing Angular Material dialog contracts with modern React patterns supporting
 * Headless UI modals, React Portal rendering, and accessible dialog components.
 * 
 * Key Features:
 * - React Portal-based dialog rendering support
 * - React state management integration patterns
 * - WCAG 2.1 AA accessible dialog patterns
 * - Headless UI Dialog primitive compatibility
 * - Promise-based dialog workflows for async operations
 * - TypeScript 5.8+ enhanced type safety
 * 
 * Integration Notes:
 * - Complements /src/components/ui/dialog/types.ts with simplified interfaces
 * - Supports React 19 concurrent features and state management
 * - Designed for Next.js 15.1+ app router compatibility
 * - Follows Section 7.7.1 accessibility standards
 * 
 * @author DreamFactory Admin Interface Migration
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 */

import { ReactNode, RefObject } from 'react';

// =============================================================================
// CORE DIALOG DATA INTERFACES
// =============================================================================

/**
 * Base dialog data interface for React dialog patterns
 * Replaces Angular dialog data contracts with React-specific patterns
 */
export interface DialogData<T = unknown> {
  /** Unique identifier for the dialog instance */
  id?: string;
  
  /** Dialog title for accessibility and display */
  title?: string;
  
  /** Dialog content - supports React nodes */
  content?: ReactNode;
  
  /** Custom data payload passed to dialog */
  data?: T;
  
  /** Dialog variant for styling and behavior */
  variant?: 'modal' | 'sheet' | 'drawer' | 'overlay';
  
  /** Size configuration */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Whether dialog can be dismissed */
  dismissible?: boolean;
  
  /** Portal container for React Portal rendering */
  container?: HTMLElement | string;
  
  /** Z-index for stacking context */
  zIndex?: number;
}

/**
 * Enhanced ConfirmDialogData interface for React dialog components
 * Updated from Angular Material patterns to support React state management
 */
export interface ConfirmDialogData {
  /** Confirmation dialog title */
  title: string;
  
  /** Message content - supports React nodes for rich formatting */
  message: ReactNode;
  
  /** Confirm button configuration */
  confirmButton?: {
    text?: string;
    variant?: 'default' | 'primary' | 'destructive' | 'success' | 'warning';
    loading?: boolean;
    disabled?: boolean;
    'data-testid'?: string;
  };
  
  /** Cancel button configuration */
  cancelButton?: {
    text?: string;
    variant?: 'default' | 'secondary' | 'ghost' | 'outline';
    disabled?: boolean;
    'data-testid'?: string;
  };
  
  /** Icon to display in the confirmation dialog */
  icon?: {
    name: string;
    color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
    size?: 'sm' | 'md' | 'lg';
  };
  
  /** Whether the action is destructive (affects styling) */
  destructive?: boolean;
  
  /** Require additional confirmation (typing confirmation text) */
  requireTextConfirmation?: {
    enabled: boolean;
    expectedText: string;
    placeholder?: string;
    helpText?: string;
  };
  
  /** Accessibility configuration */
  accessibility?: {
    'aria-describedby'?: string;
    announceOnOpen?: string;
    announceOnConfirm?: string;
    announceOnCancel?: string;
  };
  
  /** Dialog size override */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  /** Whether to prevent closing on outside click */
  preventOutsideClose?: boolean;
  
  /** Whether to prevent closing on escape key */
  preventEscapeClose?: boolean;
}

/**
 * Prompt dialog data interface for input collection
 * Supports various input types and validation patterns
 */
export interface PromptDialogData<T = string> {
  /** Prompt dialog title */
  title: string;
  
  /** Prompt message or description */
  message?: ReactNode;
  
  /** Input field configuration */
  input: {
    type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select';
    placeholder?: string;
    defaultValue?: string;
    options?: Array<{ value: string; label: string; disabled?: boolean }>;
    multiline?: boolean;
    rows?: number;
    maxLength?: number;
  };
  
  /** Validation configuration */
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp | string;
    min?: number;
    max?: number;
    validator?: (value: T) => string | null | Promise<string | null>;
  };
  
  /** Submit button configuration */
  submitButton?: {
    text?: string;
    variant?: 'default' | 'primary' | 'success';
    loading?: boolean;
  };
  
  /** Cancel button configuration */
  cancelButton?: {
    text?: string;
    variant?: 'default' | 'secondary' | 'ghost';
  };
  
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Accessibility configuration */
  accessibility?: {
    inputLabel?: string;
    inputDescription?: string;
    errorAnnouncement?: string;
  };
}

/**
 * Alert dialog data interface for notifications and messages
 * Provides standardized alert patterns with accessibility support
 */
export interface AlertDialogData {
  /** Alert title */
  title: string;
  
  /** Alert message content */
  message: ReactNode;
  
  /** Alert type affecting styling and icons */
  type: 'info' | 'success' | 'warning' | 'error';
  
  /** Action buttons */
  actions?: Array<{
    label: string;
    variant?: 'default' | 'primary' | 'secondary' | 'destructive';
    action?: () => void | Promise<void>;
    loading?: boolean;
    disabled?: boolean;
    'data-testid'?: string;
  }>;
  
  /** Auto-dismiss configuration */
  autoDismiss?: {
    enabled: boolean;
    duration: number; // in milliseconds
    showProgress?: boolean;
  };
  
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Accessibility configuration */
  accessibility?: {
    role?: 'alert' | 'alertdialog';
    'aria-live'?: 'polite' | 'assertive';
    announceOnOpen?: string;
  };
}

// =============================================================================
// REACT PORTAL AND RENDERING INTERFACES
// =============================================================================

/**
 * React Portal configuration for dialog rendering
 * Enables portal-based rendering with proper cleanup and accessibility
 */
export interface DialogPortalConfig {
  /** Portal container element or selector */
  container?: HTMLElement | string;
  
  /** Portal key for React reconciliation */
  key?: string;
  
  /** Whether to append to container or replace */
  appendMode?: 'append' | 'replace';
  
  /** CSS classes to apply to portal container */
  containerClassName?: string;
  
  /** Inline styles for portal container */
  containerStyle?: React.CSSProperties;
  
  /** Whether to preserve container on unmount */
  preserveContainer?: boolean;
  
  /** Cleanup function called on portal unmount */
  onUnmount?: () => void;
}

/**
 * Dialog component tree context for React component integration
 * Provides state and methods accessible throughout the dialog component tree
 */
export interface DialogComponentContext {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  
  /** Function to close the dialog */
  close: (reason?: DialogCloseReason) => void;
  
  /** Function to update dialog data */
  updateData: <T>(data: Partial<T>) => void;
  
  /** Current dialog data */
  data: DialogData;
  
  /** Portal configuration */
  portal: DialogPortalConfig;
  
  /** Loading state for async operations */
  loading: boolean;
  
  /** Error state */
  error: {
    hasError: boolean;
    message?: string;
    code?: string;
  };
  
  /** Dialog refs for imperative access */
  refs: {
    dialog: RefObject<HTMLDivElement>;
    content: RefObject<HTMLDivElement>;
    backdrop: RefObject<HTMLDivElement>;
    focusTrap: RefObject<HTMLDivElement>;
  };
  
  /** Accessibility state */
  accessibility: {
    titleId: string;
    descriptionId: string;
    labelledBy?: string;
    describedBy?: string;
  };
}

// =============================================================================
// STATE MANAGEMENT INTERFACES
// =============================================================================

/**
 * Dialog state management interface for React state patterns
 * Supports both controlled and uncontrolled dialog patterns
 */
export interface DialogState {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Current dialog data */
  data: DialogData | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: string | null;
  
  /** Result from dialog interaction */
  result: DialogResult | null;
  
  /** History of dialog interactions */
  history: DialogInteraction[];
}

/**
 * Dialog state actions for managing dialog lifecycle
 * Provides type-safe actions for dialog state updates
 */
export interface DialogStateActions {
  /** Open dialog with data */
  openDialog: <T>(data: DialogData<T>) => void;
  
  /** Close dialog with optional result */
  closeDialog: (result?: DialogResult) => void;
  
  /** Update dialog data */
  updateData: <T>(data: Partial<DialogData<T>>) => void;
  
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  
  /** Set error state */
  setError: (error: string | null) => void;
  
  /** Clear dialog state */
  clear: () => void;
  
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Dialog hook return interface for custom React hooks
 * Provides consistent API for dialog management hooks
 */
export interface UseDialogReturn {
  /** Current dialog state */
  state: DialogState;
  
  /** Dialog actions */
  actions: DialogStateActions;
  
  /** Helper methods */
  helpers: {
    /** Check if dialog is open */
    isOpen: boolean;
    
    /** Check if dialog has error */
    hasError: boolean;
    
    /** Check if dialog is loading */
    isLoading: boolean;
    
    /** Get current dialog data */
    getCurrentData: <T>() => DialogData<T> | null;
    
    /** Get dialog result */
    getResult: <T>() => DialogResult<T> | null;
  };
  
  /** Convenience methods for common dialog types */
  convenience: {
    /** Open confirmation dialog */
    confirm: (data: ConfirmDialogData) => Promise<boolean>;
    
    /** Open prompt dialog */
    prompt: <T>(data: PromptDialogData<T>) => Promise<T | null>;
    
    /** Open alert dialog */
    alert: (data: AlertDialogData) => Promise<void>;
  };
}

// =============================================================================
// DIALOG RESULT AND INTERACTION INTERFACES
// =============================================================================

/**
 * Dialog close reasons for tracking user interactions
 */
export type DialogCloseReason = 
  | 'confirm' 
  | 'cancel' 
  | 'escape' 
  | 'outside-click' 
  | 'programmatic'
  | 'error'
  | 'timeout';

/**
 * Dialog interaction result interface
 * Provides comprehensive result data for dialog interactions
 */
export interface DialogResult<T = unknown> {
  /** Whether the dialog was confirmed */
  confirmed: boolean;
  
  /** How the dialog was closed */
  reason: DialogCloseReason;
  
  /** Data returned from dialog */
  data?: T;
  
  /** Timestamp of interaction */
  timestamp: number;
  
  /** Duration dialog was open (in milliseconds) */
  duration: number;
  
  /** Any error that occurred */
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Dialog interaction tracking interface
 * For analytics and debugging dialog usage patterns
 */
export interface DialogInteraction {
  /** Unique interaction ID */
  id: string;
  
  /** Dialog type/variant */
  type: string;
  
  /** Timestamp when dialog opened */
  openedAt: number;
  
  /** Timestamp when dialog closed */
  closedAt?: number;
  
  /** How dialog was closed */
  closeReason?: DialogCloseReason;
  
  /** User actions within dialog */
  actions: Array<{
    type: string;
    timestamp: number;
    data?: unknown;
  }>;
  
  /** Dialog configuration */
  config: DialogData;
  
  /** Result of interaction */
  result?: DialogResult;
}

// =============================================================================
// ACCESSIBILITY PATTERN INTERFACES
// =============================================================================

/**
 * React accessibility patterns for dialog components
 * Implements WCAG 2.1 AA requirements for modal dialogs
 */
export interface DialogAccessibilityPatterns {
  /** Focus management configuration */
  focus: {
    /** Element to focus when dialog opens */
    initialFocus?: HTMLElement | string;
    
    /** Element to focus when dialog closes */
    restoreFocus?: HTMLElement | string;
    
    /** Whether to trap focus within dialog */
    trapFocus: boolean;
    
    /** Whether to auto-focus first interactive element */
    autoFocus: boolean;
  };
  
  /** Keyboard navigation patterns */
  keyboard: {
    /** Close on escape key */
    escapeToClose: boolean;
    
    /** Confirm on enter key */
    enterToConfirm: boolean;
    
    /** Tab key cycling behavior */
    tabCycling: 'trap' | 'wrap' | 'none';
    
    /** Arrow key navigation */
    arrowNavigation: boolean;
  };
  
  /** Screen reader announcements */
  announcements: {
    /** Announce when dialog opens */
    onOpen?: string;
    
    /** Announce when dialog closes */
    onClose?: string;
    
    /** Announce loading states */
    onLoading?: string;
    
    /** Announce errors */
    onError?: string;
    
    /** Announce success states */
    onSuccess?: string;
  };
  
  /** ARIA attributes configuration */
  aria: {
    /** Dialog role */
    role: 'dialog' | 'alertdialog';
    
    /** Modal behavior */
    modal: boolean;
    
    /** Live region politeness */
    live?: 'polite' | 'assertive' | 'off';
    
    /** Atomic updates */
    atomic?: boolean;
    
    /** Custom aria-label */
    label?: string;
    
    /** Reference to labelling element */
    labelledBy?: string;
    
    /** Reference to describing element */
    describedBy?: string;
  };
}

// =============================================================================
// HEADLESS UI INTEGRATION INTERFACES
// =============================================================================

/**
 * Headless UI Dialog integration configuration
 * Provides type-safe integration with Headless UI Dialog primitive
 */
export interface HeadlessUIDialogConfig {
  /** Whether dialog is open (controlled) */
  open: boolean;
  
  /** Callback when open state changes */
  onClose: (value: boolean) => void;
  
  /** Initial focus element */
  initialFocus?: RefObject<HTMLElement>;
  
  /** Static dialog (doesn't close on outside click) */
  static?: boolean;
  
  /** Unmount dialog when closed */
  unmount?: boolean;
  
  /** Dialog element props */
  dialogProps?: {
    className?: string;
    style?: React.CSSProperties;
    'data-testid'?: string;
  };
  
  /** Panel element props */
  panelProps?: {
    className?: string;
    style?: React.CSSProperties;
    'data-testid'?: string;
  };
  
  /** Backdrop element props */
  backdropProps?: {
    className?: string;
    style?: React.CSSProperties;
    'data-testid'?: string;
  };
  
  /** Transition configuration */
  transition?: {
    show?: boolean;
    appear?: boolean;
    enter?: string;
    enterFrom?: string;
    enterTo?: string;
    leave?: string;
    leaveFrom?: string;
    leaveTo?: string;
  };
}

/**
 * React dialog library compatibility interface
 * Supports integration with various React dialog libraries
 */
export interface ReactDialogLibraryConfig {
  /** Library type being used */
  library: 'headlessui' | 'radix' | 'reach' | 'mui' | 'custom';
  
  /** Library-specific configuration */
  config: unknown;
  
  /** Adapter functions for library integration */
  adapter?: {
    /** Convert our props to library props */
    propsAdapter?: (props: DialogData) => unknown;
    
    /** Convert library events to our events */
    eventAdapter?: (event: unknown) => DialogResult;
    
    /** Custom render function */
    customRender?: (props: DialogData) => ReactNode;
  };
  
  /** Feature flags for library capabilities */
  features?: {
    /** Supports portal rendering */
    portal: boolean;
    
    /** Supports focus trapping */
    focusTrap: boolean;
    
    /** Supports animations */
    animations: boolean;
    
    /** Supports nested dialogs */
    nesting: boolean;
    
    /** Supports accessibility features */
    accessibility: boolean;
  };
}

// =============================================================================
// UTILITY AND HELPER TYPES
// =============================================================================

/**
 * Dialog event handler types for type-safe event handling
 */
export interface DialogEventHandlers<T = unknown> {
  /** Called when dialog opens */
  onOpen?: (data: DialogData<T>) => void;
  
  /** Called when dialog closes */
  onClose?: (result: DialogResult<T>) => void;
  
  /** Called when dialog data updates */
  onDataChange?: (data: DialogData<T>) => void;
  
  /** Called when loading state changes */
  onLoadingChange?: (loading: boolean) => void;
  
  /** Called when error occurs */
  onError?: (error: string) => void;
  
  /** Called before dialog opens (can prevent opening) */
  onBeforeOpen?: (data: DialogData<T>) => boolean | Promise<boolean>;
  
  /** Called before dialog closes (can prevent closing) */
  onBeforeClose?: (result: DialogResult<T>) => boolean | Promise<boolean>;
}

/**
 * Dialog configuration validator interface
 * Provides runtime validation for dialog configurations
 */
export interface DialogConfigValidator {
  /** Validate dialog data */
  validateData: <T>(data: DialogData<T>) => ValidationResult;
  
  /** Validate accessibility configuration */
  validateAccessibility: (config: DialogAccessibilityPatterns) => ValidationResult;
  
  /** Validate portal configuration */
  validatePortal: (config: DialogPortalConfig) => ValidationResult;
  
  /** Get validation errors */
  getErrors: () => ValidationError[];
  
  /** Check if configuration is valid */
  isValid: () => boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Field that caused error */
  field?: string;
  
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Warning message */
  message: string;
  
  /** Field that caused warning */
  field?: string;
  
  /** Suggestion for improvement */
  suggestion?: string;
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard for ConfirmDialogData
 */
export function isConfirmDialogData(data: unknown): data is ConfirmDialogData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    'message' in data &&
    typeof (data as ConfirmDialogData).title === 'string'
  );
}

/**
 * Type guard for PromptDialogData
 */
export function isPromptDialogData<T>(data: unknown): data is PromptDialogData<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    'input' in data &&
    typeof (data as PromptDialogData<T>).title === 'string' &&
    typeof (data as PromptDialogData<T>).input === 'object'
  );
}

/**
 * Type guard for AlertDialogData
 */
export function isAlertDialogData(data: unknown): data is AlertDialogData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    'message' in data &&
    'type' in data &&
    typeof (data as AlertDialogData).title === 'string' &&
    ['info', 'success', 'warning', 'error'].includes((data as AlertDialogData).type)
  );
}

/**
 * Type guard for DialogResult
 */
export function isDialogResult<T>(value: unknown): value is DialogResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'confirmed' in value &&
    'reason' in value &&
    'timestamp' in value &&
    typeof (value as DialogResult<T>).confirmed === 'boolean' &&
    typeof (value as DialogResult<T>).timestamp === 'number'
  );
}

// =============================================================================
// EXPORT ALL TYPES
// =============================================================================

export type {
  // Core interfaces
  DialogData,
  ConfirmDialogData,
  PromptDialogData,
  AlertDialogData,
  
  // Portal and context
  DialogPortalConfig,
  DialogComponentContext,
  
  // State management
  DialogState,
  DialogStateActions,
  UseDialogReturn,
  
  // Results and interactions
  DialogCloseReason,
  DialogResult,
  DialogInteraction,
  
  // Accessibility
  DialogAccessibilityPatterns,
  
  // Library integration
  HeadlessUIDialogConfig,
  ReactDialogLibraryConfig,
  
  // Utilities
  DialogEventHandlers,
  DialogConfigValidator,
  ValidationResult,
  ValidationError,
  ValidationWarning,
};