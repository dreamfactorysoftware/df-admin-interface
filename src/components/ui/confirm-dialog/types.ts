/**
 * TypeScript interface definitions for the ConfirmDialog component system
 * 
 * This file contains comprehensive type definitions for the React-based confirmation
 * dialog component, migrated from Angular DfConfirmDialogComponent to modern React 19
 * patterns with promise-based workflows and enhanced accessibility support.
 * 
 * @version 1.0.0
 * @since 2024
 */

import { ReactNode, ComponentProps } from 'react';

/**
 * Core dialog data interface migrated from Angular src/app/shared/types/dialog.ts
 * Maintains compatibility with existing ConfirmDialogData structure while adding
 * React-specific enhancements and promise-based workflow support.
 */
export interface ConfirmDialogData {
  /** Dialog title displayed in the header */
  title: string;
  
  /** Main message content displayed in the dialog body */
  message: string;
  
  /** Optional detailed description or additional context */
  description?: string;
  
  /** Custom icon or visual element to display alongside the message */
  icon?: ReactNode;
  
  /** Severity level determining dialog appearance and default behavior */
  severity?: DialogSeverity;
  
  /** Text for the confirmation button (defaults to severity-specific text) */
  confirmText?: string;
  
  /** Text for the cancellation button (defaults to "Cancel") */
  cancelText?: string;
  
  /** Whether the confirmation action is destructive (affects styling) */
  destructive?: boolean;
  
  /** Whether to show the cancel button (defaults to true) */
  showCancel?: boolean;
  
  /** Whether to auto-focus the confirm button instead of cancel (defaults to false) */
  focusConfirm?: boolean;
  
  /** Custom CSS classes for dialog styling */
  className?: string;
  
  /** Data attributes for testing and automation */
  'data-testid'?: string;
}

/**
 * Severity levels for confirmation dialogs affecting visual appearance and default behavior
 */
export type DialogSeverity = 
  | 'info'      // General information or confirmation
  | 'warning'   // Cautionary action requiring attention
  | 'error'     // Dangerous or irreversible action
  | 'success'   // Positive confirmation or completion
  | 'question'; // Simple yes/no question

/**
 * React-specific props interface for the ConfirmDialog component
 * Combines dialog data with React component lifecycle and callback patterns
 */
export interface ConfirmDialogProps extends ConfirmDialogData {
  /** Whether the dialog is currently open */
  open: boolean;
  
  /** 
   * Callback fired when dialog state should change
   * @param open - New open state
   */
  onOpenChange: (open: boolean) => void;
  
  /**
   * Callback fired when user confirms the action
   * Should return a promise that resolves when the action completes
   * If promise rejects, dialog remains open to show error state
   */
  onConfirm?: () => Promise<void> | void;
  
  /**
   * Callback fired when user cancels or dismisses the dialog
   */
  onCancel?: () => void;
  
  /**
   * Custom confirm button props override
   */
  confirmButtonProps?: Partial<ComponentProps<'button'>>;
  
  /**
   * Custom cancel button props override
   */
  cancelButtonProps?: Partial<ComponentProps<'button'>>;
  
  /**
   * Animation configuration for dialog transitions
   */
  animation?: DialogAnimationConfig;
  
  /**
   * Accessibility configuration for enhanced screen reader support
   */
  accessibility?: DialogAccessibilityConfig;
  
  /**
   * Theme variant override for dialog appearance
   */
  theme?: DialogTheme;
  
  /**
   * Whether to trap focus within the dialog (defaults to true)
   */
  trapFocus?: boolean;
  
  /**
   * Whether to close dialog on overlay click (defaults to true)
   */
  closeOnOverlayClick?: boolean;
  
  /**
   * Whether to close dialog on escape key (defaults to true)
   */
  closeOnEscape?: boolean;
  
  /**
   * Loading state management for async operations
   */
  loading?: boolean;
  
  /**
   * Error state for displaying action failures
   */
  error?: string | null;
}

/**
 * Animation configuration interface for dialog transitions and state changes
 */
export interface DialogAnimationConfig {
  /** Duration of enter animation in milliseconds */
  enterDuration?: number;
  
  /** Duration of exit animation in milliseconds */
  exitDuration?: number;
  
  /** Easing function for animations */
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  
  /** Whether to animate dialog scale on open/close */
  scale?: boolean;
  
  /** Whether to animate dialog fade on open/close */
  fade?: boolean;
  
  /** Whether to animate backdrop blur effect */
  blur?: boolean;
  
  /** Custom animation class names */
  customClasses?: {
    enter?: string;
    enterFrom?: string;
    enterTo?: string;
    leave?: string;
    leaveFrom?: string;
    leaveTo?: string;
  };
}

/**
 * Accessibility configuration for enhanced screen reader and keyboard support
 */
export interface DialogAccessibilityConfig {
  /** Custom ARIA label for the dialog */
  ariaLabel?: string;
  
  /** ID of element that labels the dialog */
  ariaLabelledBy?: string;
  
  /** ID of element that describes the dialog */
  ariaDescribedBy?: string;
  
  /** Role override for the dialog element */
  role?: 'dialog' | 'alertdialog';
  
  /** Whether to announce dialog content to screen readers immediately */
  announceContent?: boolean;
  
  /** Custom announcement text for screen readers */
  announcement?: string;
  
  /** Keyboard shortcut configuration */
  shortcuts?: {
    /** Custom key for confirm action (defaults to Enter) */
    confirmKey?: string;
    
    /** Custom key for cancel action (defaults to Escape) */
    cancelKey?: string;
    
    /** Whether to require modifier keys */
    requireModifier?: boolean;
  };
}

/**
 * Theme variants for dialog appearance customization
 */
export type DialogTheme = 
  | 'default'   // Standard dialog appearance
  | 'minimal'   // Reduced visual elements
  | 'card'      // Card-style dialog with elevation
  | 'overlay'   // Full-screen overlay style
  | 'inline';   // Inline dialog without backdrop

/**
 * Dialog state management interface for complex dialog workflows
 */
export interface DialogState {
  /** Current loading state of dialog actions */
  loading: boolean;
  
  /** Current error state */
  error: string | null;
  
  /** Whether dialog is currently animating */
  animating: boolean;
  
  /** Whether dialog has been shown (for analytics) */
  hasBeenShown: boolean;
  
  /** Timestamp when dialog was opened */
  openedAt?: number;
  
  /** Number of times user has attempted confirmation */
  attemptCount: number;
}

/**
 * Callback function type for confirmation actions with promise support
 */
export type ConfirmationCallback = () => Promise<boolean> | boolean | Promise<void> | void;

/**
 * Callback function type for cancellation actions
 */
export type CancellationCallback = () => void | Promise<void>;

/**
 * Hook return type for useConfirmDialog custom hook
 */
export interface UseConfirmDialogReturn {
  /** Function to show confirmation dialog with promise-based workflow */
  confirm: (data: ConfirmDialogData) => Promise<boolean>;
  
  /** Function to show confirmation dialog without waiting for result */
  show: (data: ConfirmDialogData, callbacks?: DialogCallbacks) => void;
  
  /** Function to programmatically close dialog */
  close: () => void;
  
  /** Current dialog state */
  state: DialogState;
  
  /** Whether dialog is currently open */
  isOpen: boolean;
  
  /** Current dialog data */
  data: ConfirmDialogData | null;
}

/**
 * Callback configuration interface for dialog interactions
 */
export interface DialogCallbacks {
  /** Callback for confirmation action */
  onConfirm?: ConfirmationCallback;
  
  /** Callback for cancellation action */
  onCancel?: CancellationCallback;
  
  /** Callback for dialog open event */
  onOpen?: () => void;
  
  /** Callback for dialog close event */
  onClose?: () => void;
  
  /** Callback for error events */
  onError?: (error: Error) => void;
}

/**
 * Provider props interface for ConfirmDialogProvider context
 */
export interface ConfirmDialogProviderProps {
  /** Child components */
  children: ReactNode;
  
  /** Default configuration for all dialogs */
  defaultConfig?: Partial<ConfirmDialogProps>;
  
  /** Maximum number of dialogs that can be stacked */
  maxStack?: number;
  
  /** Global error handler for dialog actions */
  onError?: (error: Error, dialogData: ConfirmDialogData) => void;
}

/**
 * Context value interface for ConfirmDialog context
 */
export interface ConfirmDialogContextValue {
  /** Queue of active dialogs */
  dialogs: Array<{
    id: string;
    data: ConfirmDialogData;
    callbacks: DialogCallbacks;
    state: DialogState;
  }>;
  
  /** Function to add dialog to queue */
  addDialog: (data: ConfirmDialogData, callbacks?: DialogCallbacks) => Promise<boolean>;
  
  /** Function to remove dialog from queue */
  removeDialog: (id: string) => void;
  
  /** Function to clear all dialogs */
  clearDialogs: () => void;
  
  /** Global dialog configuration */
  config: Partial<ConfirmDialogProps>;
}

/**
 * Preset confirmation dialog configurations for common use cases
 */
export interface DialogPresets {
  /** Delete confirmation with warning severity */
  delete: (itemName?: string) => ConfirmDialogData;
  
  /** Save confirmation for unsaved changes */
  save: (hasChanges?: boolean) => ConfirmDialogData;
  
  /** Cancel confirmation for form abandonment */
  cancel: (hasChanges?: boolean) => ConfirmDialogData;
  
  /** Logout confirmation */
  logout: () => ConfirmDialogData;
  
  /** Generic confirmation */
  confirm: (message: string, title?: string) => ConfirmDialogData;
  
  /** Error acknowledgment */
  error: (message: string, title?: string) => ConfirmDialogData;
  
  /** Success notification */
  success: (message: string, title?: string) => ConfirmDialogData;
  
  /** Warning notification */
  warning: (message: string, title?: string) => ConfirmDialogData;
}

/**
 * Configuration options for dialog presets
 */
export interface DialogPresetConfig {
  /** Default confirmation text */
  confirmText?: string;
  
  /** Default cancellation text */
  cancelText?: string;
  
  /** Whether to make confirmations destructive by default */
  destructiveByDefault?: boolean;
  
  /** Default dialog theme */
  defaultTheme?: DialogTheme;
  
  /** Internationalization key prefix for text lookups */
  i18nPrefix?: string;
}

/**
 * Type guard to check if a value is a valid DialogSeverity
 */
export function isDialogSeverity(value: unknown): value is DialogSeverity {
  return typeof value === 'string' && 
    ['info', 'warning', 'error', 'success', 'question'].includes(value);
}

/**
 * Type guard to check if a value is a valid DialogTheme
 */
export function isDialogTheme(value: unknown): value is DialogTheme {
  return typeof value === 'string' && 
    ['default', 'minimal', 'card', 'overlay', 'inline'].includes(value);
}

/**
 * Utility type for making dialog data properties optional for convenience
 */
export type PartialDialogData = Partial<ConfirmDialogData> & {
  title: string;
  message: string;
};

/**
 * Utility type for dialog configuration with required open state
 */
export type DialogConfig = Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>;

/**
 * Generic type for dialog result with typed return value
 */
export type DialogResult<T = boolean> = Promise<T>;

/**
 * Event types for dialog state changes and user interactions
 */
export interface DialogEvents {
  /** Dialog opened event */
  'dialog:open': {
    id: string;
    data: ConfirmDialogData;
  };
  
  /** Dialog closed event */
  'dialog:close': {
    id: string;
    result: boolean;
    reason: 'confirm' | 'cancel' | 'escape' | 'overlay';
  };
  
  /** Dialog error event */
  'dialog:error': {
    id: string;
    error: Error;
    data: ConfirmDialogData;
  };
  
  /** Dialog state change event */
  'dialog:state': {
    id: string;
    state: DialogState;
  };
}

/**
 * Export all types for convenient importing
 */
export type {
  // Core interfaces
  ConfirmDialogData,
  ConfirmDialogProps,
  DialogState,
  
  // Configuration interfaces
  DialogAnimationConfig,
  DialogAccessibilityConfig,
  DialogCallbacks,
  
  // Provider and context interfaces
  ConfirmDialogProviderProps,
  ConfirmDialogContextValue,
  
  // Hook interfaces
  UseConfirmDialogReturn,
  
  // Preset interfaces
  DialogPresets,
  DialogPresetConfig,
  
  // Enum types
  DialogSeverity,
  DialogTheme,
  
  // Function types
  ConfirmationCallback,
  CancellationCallback,
  
  // Utility types
  PartialDialogData,
  DialogConfig,
  DialogResult,
  DialogEvents,
};