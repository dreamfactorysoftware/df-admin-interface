import { ReactNode, RefObject } from 'react';

/**
 * Base popup configuration interface migrated from Angular PopupConfig
 * Enhanced for React context with additional functionality
 */
export interface PopupConfig {
  /** Main message content to display in the popup */
  message: string;
  /** Whether to show the "Remind Me Later" button */
  showRemindMeLater: boolean;
  /** Optional title for the popup */
  title?: string;
  /** Popup variant for consistent theming */
  variant?: PopupVariant;
  /** Size configuration for the popup */
  size?: PopupSize;
  /** Whether the popup can be dismissed by clicking outside */
  dismissOnClickOutside?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Auto-dismiss timeout in milliseconds */
  autoCloseTimeout?: number;
  /** Custom CSS classes for styling */
  className?: string;
  /** Accessibility configuration */
  accessibility?: PopupAccessibilityConfig;
  /** Animation configuration */
  animation?: PopupAnimationConfig;
}

/**
 * React-specific popup component props interface
 * Defines callback signatures and event handling for React patterns
 */
export interface PopupProps extends Omit<PopupConfig, 'message'> {
  /** Popup content - can be string or ReactNode for flexibility */
  children: ReactNode;
  /** Whether the popup is currently open */
  isOpen: boolean;
  /** Callback fired when popup is requested to close */
  onClose: () => void;
  /** Callback fired when "Remind Me Later" is clicked */
  onRemindLater?: () => void;
  /** Callback fired when popup opens */
  onOpen?: () => void;
  /** Callback fired on any button click with button type */
  onButtonClick?: (buttonType: PopupButtonType) => void;
  /** Custom action buttons configuration */
  actions?: PopupAction[];
  /** Portal container ref for popup positioning */
  portalRef?: RefObject<HTMLElement>;
  /** Z-index for layering */
  zIndex?: number;
  /** Theme configuration */
  theme?: PopupThemeConfig;
  /** Internationalization configuration */
  i18n?: PopupI18nConfig;
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * Popup variants for consistent theming across the application
 */
export type PopupVariant = 
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'confirmation'
  | 'authentication'
  | 'announcement';

/**
 * Popup size configurations
 */
export type PopupSize = 
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'full';

/**
 * Button types for popup actions
 */
export type PopupButtonType = 
  | 'close'
  | 'confirm'
  | 'cancel'
  | 'remindLater'
  | 'custom';

/**
 * Individual popup action configuration
 */
export interface PopupAction {
  /** Button label text or translation key */
  label: string;
  /** Button type for styling and behavior */
  type: PopupButtonType;
  /** Button variant for theming */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  /** Click handler for the action */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Whether this action should close the popup */
  closesPopup?: boolean;
  /** Loading state for async actions */
  loading?: boolean;
  /** Icon to display alongside text */
  icon?: ReactNode;
  /** Accessibility label */
  ariaLabel?: string;
}

/**
 * WCAG 2.1 AA compliant accessibility configuration
 */
export interface PopupAccessibilityConfig {
  /** ARIA role for the popup */
  role?: 'dialog' | 'alertdialog' | 'tooltip' | 'menu';
  /** ARIA label for screen readers */
  ariaLabel?: string;
  /** ID of element that describes the popup */
  ariaDescribedBy?: string;
  /** ID of element that labels the popup */
  ariaLabelledBy?: string;
  /** Whether to trap focus within the popup */
  trapFocus?: boolean;
  /** Element to focus when popup opens */
  initialFocus?: 'first' | 'last' | 'cancel' | 'confirm' | string;
  /** Element to return focus to when popup closes */
  returnFocus?: RefObject<HTMLElement>;
  /** Whether to announce popup opening to screen readers */
  announceOnOpen?: boolean;
  /** Custom announcement message */
  openAnnouncement?: string;
  /** Whether the popup is modal (blocks interaction with background) */
  modal?: boolean;
}

/**
 * Animation configuration for popup transitions
 */
export interface PopupAnimationConfig {
  /** Animation preset */
  preset?: 'fade' | 'slide' | 'scale' | 'bounce' | 'none';
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation easing function */
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  /** Direction for slide animations */
  slideDirection?: 'up' | 'down' | 'left' | 'right';
  /** Whether to animate the backdrop */
  animateBackdrop?: boolean;
  /** Custom transition classes */
  customClasses?: {
    enter?: string;
    enterActive?: string;
    exit?: string;
    exitActive?: string;
  };
}

/**
 * Theme configuration for popup appearance
 */
export interface PopupThemeConfig {
  /** Background color variant */
  background?: 'light' | 'dark' | 'auto';
  /** Border configuration */
  border?: {
    width?: 'none' | 'thin' | 'medium' | 'thick';
    color?: string;
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  };
  /** Shadow configuration */
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Backdrop configuration */
  backdrop?: {
    color?: string;
    opacity?: number;
    blur?: boolean;
  };
  /** Typography overrides */
  typography?: {
    titleSize?: 'sm' | 'md' | 'lg' | 'xl';
    bodySize?: 'xs' | 'sm' | 'md' | 'lg';
    titleWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  };
}

/**
 * Internationalization configuration for popup content
 */
export interface PopupI18nConfig {
  /** Current locale for message display */
  locale?: string;
  /** Translation namespace for message keys */
  namespace?: string;
  /** Fallback locale if translation is missing */
  fallbackLocale?: string;
  /** Custom translation function */
  translateFn?: (key: string, params?: Record<string, any>) => string;
  /** Right-to-left text direction support */
  rtl?: boolean;
  /** Default button labels by locale */
  buttonLabels?: {
    close?: string;
    confirm?: string;
    cancel?: string;
    remindLater?: string;
  };
}

/**
 * Authentication workflow callback types for redirect and logout functionality
 */
export interface AuthWorkflowCallbacks {
  /** Callback for authentication redirect workflows */
  onAuthRedirect?: (redirectUrl: string, reason: AuthRedirectReason) => void;
  /** Callback for logout workflows */
  onLogout?: (reason: LogoutReason) => Promise<void>;
  /** Callback for session timeout handling */
  onSessionTimeout?: () => void;
  /** Callback for unauthorized access handling */
  onUnauthorized?: (resource: string) => void;
  /** Callback for authentication success */
  onAuthSuccess?: (user: any) => void;
  /** Callback for authentication failure */
  onAuthFailure?: (error: string) => void;
}

/**
 * Authentication redirect reasons
 */
export type AuthRedirectReason = 
  | 'sessionExpired'
  | 'loginRequired'
  | 'insufficientPermissions'
  | 'accountLocked'
  | 'passwordExpired'
  | 'maintenanceMode';

/**
 * Logout reasons for tracking and analytics
 */
export type LogoutReason = 
  | 'userInitiated'
  | 'sessionTimeout'
  | 'securityBreach'
  | 'adminForced'
  | 'systemMaintenance';

/**
 * Popup state management interface for context-based popup control
 */
export interface PopupState {
  /** Currently active popups by ID */
  activePopups: Map<string, PopupInstance>;
  /** Default configuration for new popups */
  defaultConfig: Partial<PopupConfig>;
  /** Global popup settings */
  globalSettings: PopupGlobalSettings;
  /** Animation queue for managing multiple popups */
  animationQueue: string[];
  /** Z-index counter for layering */
  zIndexCounter: number;
}

/**
 * Individual popup instance data
 */
export interface PopupInstance {
  /** Unique identifier for the popup */
  id: string;
  /** Popup configuration */
  config: PopupConfig;
  /** Current state of the popup */
  state: PopupInstanceState;
  /** Timestamp when popup was created */
  createdAt: number;
  /** Timestamp when popup was last updated */
  updatedAt: number;
  /** Promise resolver for programmatic control */
  resolver?: (result: PopupResult) => void;
}

/**
 * Individual popup instance state
 */
export interface PopupInstanceState {
  /** Whether the popup is currently visible */
  isVisible: boolean;
  /** Whether the popup is in the process of opening/closing */
  isTransitioning: boolean;
  /** Current z-index value */
  zIndex: number;
  /** Whether the popup has focus */
  hasFocus: boolean;
  /** Last user interaction timestamp */
  lastInteraction?: number;
}

/**
 * Result returned when popup is closed programmatically
 */
export interface PopupResult {
  /** How the popup was closed */
  action: PopupButtonType | 'dismissal' | 'timeout';
  /** Any data associated with the action */
  data?: any;
  /** Whether the action was successful */
  success: boolean;
}

/**
 * Global popup system settings
 */
export interface PopupGlobalSettings {
  /** Maximum number of concurrent popups */
  maxConcurrentPopups: number;
  /** Default animation configuration */
  defaultAnimation: PopupAnimationConfig;
  /** Default accessibility configuration */
  defaultAccessibility: PopupAccessibilityConfig;
  /** Whether to persist popup preferences */
  persistPreferences: boolean;
  /** Default auto-close timeout */
  defaultAutoCloseTimeout: number;
  /** Whether to stack popups or replace them */
  stackingMode: 'stack' | 'replace' | 'queue';
}

/**
 * Context type for hook-based popup management replacing Angular service injection
 */
export interface PopupContextType {
  /** Current popup state */
  state: PopupState;
  /** Show a popup with given configuration */
  showPopup: (config: PopupConfig) => Promise<PopupResult>;
  /** Close a specific popup by ID */
  closePopup: (id: string, result?: PopupResult) => void;
  /** Close all active popups */
  closeAllPopups: () => void;
  /** Update popup configuration */
  updatePopup: (id: string, config: Partial<PopupConfig>) => void;
  /** Check if a popup is currently active */
  isPopupActive: (id: string) => boolean;
  /** Get popup instance by ID */
  getPopup: (id: string) => PopupInstance | undefined;
  /** Update global settings */
  updateGlobalSettings: (settings: Partial<PopupGlobalSettings>) => void;
  /** Subscribe to popup state changes */
  subscribe: (callback: (state: PopupState) => void) => () => void;
  /** Authentication workflow helpers */
  auth: AuthWorkflowCallbacks;
}

/**
 * Hook return type for usePopup hook
 */
export interface UsePopupReturn {
  /** Show a popup and return a promise that resolves with the result */
  showPopup: (config: PopupConfig) => Promise<PopupResult>;
  /** Show a confirmation popup with predefined styling */
  confirm: (message: string, options?: Partial<PopupConfig>) => Promise<boolean>;
  /** Show an alert popup with predefined styling */
  alert: (message: string, options?: Partial<PopupConfig>) => Promise<void>;
  /** Show a prompt popup for user input */
  prompt: (message: string, defaultValue?: string, options?: Partial<PopupConfig>) => Promise<string | null>;
  /** Show an authentication-related popup */
  authPopup: (type: AuthRedirectReason, options?: Partial<PopupConfig>) => Promise<PopupResult>;
  /** Close all popups */
  closeAll: () => void;
  /** Current popup state for component rendering */
  state: PopupState;
}

/**
 * Props for popup provider component
 */
export interface PopupProviderProps {
  /** Child components */
  children: ReactNode;
  /** Initial global settings */
  defaultSettings?: Partial<PopupGlobalSettings>;
  /** Default popup configuration */
  defaultConfig?: Partial<PopupConfig>;
  /** Authentication workflow callbacks */
  authCallbacks?: AuthWorkflowCallbacks;
  /** Portal container for popup rendering */
  portalContainer?: HTMLElement;
}

/**
 * Utility type for popup configuration presets
 */
export type PopupPreset = {
  [K in PopupVariant]: Partial<PopupConfig>;
};

/**
 * Type guard for checking if a value is a valid popup variant
 */
export function isPopupVariant(value: any): value is PopupVariant {
  return typeof value === 'string' && [
    'default', 'success', 'warning', 'error', 
    'info', 'confirmation', 'authentication', 'announcement'
  ].includes(value);
}

/**
 * Type guard for checking if a value is a valid popup size
 */
export function isPopupSize(value: any): value is PopupSize {
  return typeof value === 'string' && [
    'xs', 'sm', 'md', 'lg', 'xl', 'full'
  ].includes(value);
}

/**
 * Default popup configuration values
 */
export const DEFAULT_POPUP_CONFIG: Required<PopupConfig> = {
  message: '',
  showRemindMeLater: false,
  title: '',
  variant: 'default',
  size: 'md',
  dismissOnClickOutside: true,
  showCloseButton: true,
  autoCloseTimeout: 0,
  className: '',
  accessibility: {
    role: 'dialog',
    trapFocus: true,
    initialFocus: 'first',
    announceOnOpen: true,
    modal: true,
  },
  animation: {
    preset: 'fade',
    duration: 200,
    easing: 'ease-out',
    animateBackdrop: true,
  },
};

/**
 * Default global popup settings
 */
export const DEFAULT_GLOBAL_SETTINGS: PopupGlobalSettings = {
  maxConcurrentPopups: 3,
  defaultAnimation: DEFAULT_POPUP_CONFIG.animation,
  defaultAccessibility: DEFAULT_POPUP_CONFIG.accessibility,
  persistPreferences: true,
  defaultAutoCloseTimeout: 0,
  stackingMode: 'stack',
};

/**
 * Popup size configuration mapping for consistent sizing
 */
export const POPUP_SIZE_CONFIG = {
  xs: { maxWidth: '320px', padding: 'p-4' },
  sm: { maxWidth: '384px', padding: 'p-6' },
  md: { maxWidth: '448px', padding: 'p-6' },
  lg: { maxWidth: '512px', padding: 'p-8' },
  xl: { maxWidth: '672px', padding: 'p-8' },
  full: { maxWidth: '100%', padding: 'p-8' },
} as const;

/**
 * Z-index base values for popup layering
 */
export const POPUP_Z_INDEX = {
  base: 1000,
  backdrop: 999,
  increment: 10,
} as const;