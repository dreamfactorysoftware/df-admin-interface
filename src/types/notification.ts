/**
 * Notification Type Definitions
 * 
 * Comprehensive type definitions for the React notification system replacing Angular
 * DfSnackbarService and NotificationService. Provides type safety for toast notifications,
 * alert states, and notification persistence with accessibility compliance.
 * 
 * Features:
 * - React 19 compatible notification types
 * - TypeScript 5.8+ enhanced inference support
 * - WCAG 2.1 AA accessibility compliance types
 * - Tailwind CSS integration for styling
 * - Notification queue management with automatic dismissal
 * 
 * @fileoverview Notification types for React notification system
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 */

// =============================================================================
// CORE NOTIFICATION TYPES
// =============================================================================

/**
 * Notification severity levels
 * Maps to Angular AlertType for migration compatibility
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification display positions
 * Supports various positioning strategies for toast notifications
 */
export type NotificationPosition = 
  | 'top-right' 
  | 'top-left' 
  | 'top-center'
  | 'bottom-right' 
  | 'bottom-left' 
  | 'bottom-center';

/**
 * Notification display variants
 * Controls visual appearance and behavior
 */
export type NotificationVariant = 
  | 'toast'      // Floating toast notification
  | 'banner'     // Full-width banner
  | 'inline'     // Inline with content
  | 'modal';     // Modal overlay

/**
 * Notification duration options
 * Controls auto-dismissal behavior
 */
export type NotificationDuration = 
  | number       // Specific milliseconds
  | 'persistent' // Never auto-dismiss
  | 'short'      // 3000ms
  | 'medium'     // 5000ms (default)
  | 'long';      // 10000ms

// =============================================================================
// NOTIFICATION DATA STRUCTURES
// =============================================================================

/**
 * Core notification object
 * Represents a single notification instance
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  
  /** Notification type/severity */
  type: NotificationType;
  
  /** Primary notification title */
  title?: string;
  
  /** Main notification message */
  message: string;
  
  /** Additional description or details */
  description?: string;
  
  /** Display variant */
  variant?: NotificationVariant;
  
  /** Position on screen */
  position?: NotificationPosition;
  
  /** Auto-dismissal timing */
  duration?: NotificationDuration;
  
  /** Whether notification can be manually dismissed */
  dismissible?: boolean;
  
  /** Whether to announce to screen readers */
  announce?: boolean;
  
  /** Timestamp when notification was created */
  timestamp: number;
  
  /** Actions available for this notification */
  actions?: NotificationAction[];
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Notification action button configuration
 * Enables interactive notifications with custom actions
 */
export interface NotificationAction {
  /** Action button label */
  label: string;
  
  /** Action callback function */
  onClick: () => void | Promise<void>;
  
  /** Button styling variant */
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  
  /** Whether action dismisses notification after execution */
  dismissOnClick?: boolean;
  
  /** Keyboard shortcut for action */
  shortcut?: string;
}

// =============================================================================
// NOTIFICATION QUEUE MANAGEMENT
// =============================================================================

/**
 * Notification queue configuration
 * Controls global notification behavior
 */
export interface NotificationQueueConfig {
  /** Maximum number of notifications to display simultaneously */
  maxNotifications?: number;
  
  /** Default position for new notifications */
  defaultPosition?: NotificationPosition;
  
  /** Default duration for auto-dismissal */
  defaultDuration?: NotificationDuration;
  
  /** Whether to group similar notifications */
  groupSimilar?: boolean;
  
  /** Animation duration for enter/exit transitions */
  animationDuration?: number;
  
  /** Z-index for notification overlay */
  zIndex?: number;
}

/**
 * Notification queue state
 * Represents current state of all notifications
 */
export interface NotificationQueueState {
  /** Array of active notifications */
  notifications: Notification[];
  
  /** Queue configuration */
  config: NotificationQueueConfig;
  
  /** Whether notifications are paused (on hover) */
  paused: boolean;
  
  /** Last notification element identifier (for edit page persistence) */
  lastElementId?: string;
  
  /** Whether current page is an edit page */
  isEditPage: boolean;
}

// =============================================================================
// NOTIFICATION HOOK INTERFACES
// =============================================================================

/**
 * Hook return interface
 * Defines the API returned by useNotifications hook
 */
export interface UseNotificationsReturn {
  /** Array of current notifications */
  notifications: Notification[];
  
  /** Show a notification */
  notify: (config: NotificationConfig) => string;
  
  /** Show success notification */
  success: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Show error notification */
  error: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Show warning notification */
  warning: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Show info notification */
  info: (message: string, options?: Partial<NotificationConfig>) => string;
  
  /** Dismiss specific notification by ID */
  dismiss: (id: string) => void;
  
  /** Dismiss all notifications */
  dismissAll: () => void;
  
  /** Pause auto-dismissal (useful on hover) */
  pause: () => void;
  
  /** Resume auto-dismissal */
  resume: () => void;
  
  /** Update notification queue configuration */
  updateConfig: (config: Partial<NotificationQueueConfig>) => void;
  
  /** Set edit page state for persistence */
  setEditPageState: (isEditPage: boolean, elementId?: string) => void;
  
  /** Get last notification element for edit page workflows */
  getLastElement: () => string | undefined;
  
  /** Check if notifications are currently paused */
  isPaused: boolean;
  
  /** Current queue configuration */
  config: NotificationQueueConfig;
}

/**
 * Notification configuration for creating new notifications
 * Extends base Notification interface with optional fields
 */
export interface NotificationConfig extends Omit<Notification, 'id' | 'timestamp'> {
  /** Override generated ID */
  id?: string;
  
  /** Override timestamp */
  timestamp?: number;
}

// =============================================================================
// NOTIFICATION CONTEXT TYPES
// =============================================================================

/**
 * Notification context value interface
 * Provides notification functionality throughout component tree
 */
export interface NotificationContextValue extends UseNotificationsReturn {
  /** Provider configuration */
  providerConfig?: NotificationQueueConfig;
}

/**
 * Notification provider props
 * Configuration for NotificationProvider component
 */
export interface NotificationProviderProps {
  children: React.ReactNode;
  config?: NotificationQueueConfig;
}

// =============================================================================
// ACCESSIBILITY TYPES
// =============================================================================

/**
 * ARIA live region configuration
 * Ensures proper screen reader announcements
 */
export interface NotificationAriaConfig {
  /** ARIA live region politeness */
  'aria-live': 'polite' | 'assertive' | 'off';
  
  /** ARIA role for notification */
  role: 'alert' | 'status' | 'log' | 'region';
  
  /** ARIA label for notification */
  'aria-label'?: string;
  
  /** ARIA description */
  'aria-describedby'?: string;
  
  /** Whether notification is atomic */
  'aria-atomic'?: boolean;
}

/**
 * Keyboard navigation configuration
 * Supports keyboard accessibility for notifications
 */
export interface NotificationKeyboardConfig {
  /** Escape key dismisses notification */
  escapeKeyDismisses?: boolean;
  
  /** Tab navigation through actions */
  tabNavigation?: boolean;
  
  /** Arrow key navigation */
  arrowKeyNavigation?: boolean;
  
  /** Focus management on show/hide */
  focusManagement?: boolean;
}

// =============================================================================
// PERSISTENCE TYPES
// =============================================================================

/**
 * Notification persistence configuration
 * Controls notification behavior during navigation and page changes
 */
export interface NotificationPersistence {
  /** Key for localStorage persistence */
  persistenceKey?: string;
  
  /** Types of notifications to persist */
  persistTypes?: NotificationType[];
  
  /** Maximum age for persisted notifications (ms) */
  maxAge?: number;
  
  /** Whether to restore notifications on page load */
  restoreOnLoad?: boolean;
  
  /** Whether to clear notifications on navigation */
  clearOnNavigation?: boolean;
}

// =============================================================================
// MIGRATION COMPATIBILITY TYPES
// =============================================================================

/**
 * Angular DfSnackbarService compatibility interface
 * Maintains API compatibility during migration
 */
export interface DfSnackbarCompatibility {
  /** Set last element and edit page state */
  setSnackbarLastEle: (config: string, isEditPage: boolean) => void;
  
  /** Open snack bar with message and alert type */
  openSnackBar: (message: string, alertType: NotificationType) => void;
  
  /** Observable for last element changes */
  snackbarLastEle$?: {
    subscribe: (callback: (config: string) => void) => void;
  };
  
  /** Observable for edit page state */
  isEditPage$?: {
    subscribe: (callback: (isEditPage: boolean) => void) => void;
  };
}

/**
 * Angular NotificationService compatibility interface
 * Maintains API compatibility during migration
 */
export interface NotificationServiceCompatibility {
  /** Show success notification */
  success: (title: string, message: string) => void;
  
  /** Show error notification */
  error: (title: string, message: string) => void;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default notification queue configuration
 */
export const DEFAULT_NOTIFICATION_CONFIG: NotificationQueueConfig = {
  maxNotifications: 5,
  defaultPosition: 'bottom-right',
  defaultDuration: 'medium',
  groupSimilar: false,
  animationDuration: 300,
  zIndex: 9999,
} as const;

/**
 * Default duration mappings
 */
export const DURATION_PRESETS: Record<Exclude<NotificationDuration, number>, number> = {
  short: 3000,
  medium: 5000,
  long: 10000,
  persistent: -1,
} as const;

/**
 * ARIA configuration by notification type
 */
export const ARIA_CONFIG_BY_TYPE: Record<NotificationType, NotificationAriaConfig> = {
  success: {
    'aria-live': 'polite',
    role: 'status',
    'aria-atomic': true,
  },
  info: {
    'aria-live': 'polite',
    role: 'status',
    'aria-atomic': true,
  },
  warning: {
    'aria-live': 'polite',
    role: 'alert',
    'aria-atomic': true,
  },
  error: {
    'aria-live': 'assertive',
    role: 'alert',
    'aria-atomic': true,
  },
} as const;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Notification ID generator function type
 */
export type NotificationIdGenerator = () => string;

/**
 * Notification filter function type
 */
export type NotificationFilter = (notification: Notification) => boolean;

/**
 * Notification sort function type
 */
export type NotificationSort = (a: Notification, b: Notification) => number;

/**
 * Event handlers for notification lifecycle
 */
export interface NotificationEventHandlers {
  /** Called when notification is shown */
  onShow?: (notification: Notification) => void;
  
  /** Called when notification is dismissed */
  onDismiss?: (notification: Notification) => void;
  
  /** Called when notification expires */
  onExpire?: (notification: Notification) => void;
  
  /** Called when notification action is clicked */
  onActionClick?: (notification: Notification, action: NotificationAction) => void;
  
  /** Called when queue reaches max capacity */
  onQueueFull?: (newNotification: Notification, queue: Notification[]) => void;
}

// =============================================================================
// TESTING TYPES
// =============================================================================

/**
 * Testing utilities for notifications
 */
export interface NotificationTestUtils {
  /** Mock notification generator */
  createMockNotification: (overrides?: Partial<Notification>) => Notification;
  
  /** Wait for notification to appear */
  waitForNotification: (id: string, timeout?: number) => Promise<Notification>;
  
  /** Get all notifications by type */
  getNotificationsByType: (type: NotificationType) => Notification[];
  
  /** Simulate notification interaction */
  simulateInteraction: (id: string, action: 'dismiss' | 'click' | 'hover') => void;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for NotificationType
 */
export const isNotificationType = (value: unknown): value is NotificationType => {
  return typeof value === 'string' && 
    ['success', 'error', 'warning', 'info'].includes(value);
};

/**
 * Type guard for NotificationPosition
 */
export const isNotificationPosition = (value: unknown): value is NotificationPosition => {
  return typeof value === 'string' && 
    ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'].includes(value);
};

/**
 * Type guard for NotificationVariant
 */
export const isNotificationVariant = (value: unknown): value is NotificationVariant => {
  return typeof value === 'string' && 
    ['toast', 'banner', 'inline', 'modal'].includes(value);
};

/**
 * Type guard for complete Notification object
 */
export const isNotification = (value: unknown): value is Notification => {
  if (typeof value !== 'object' || value === null) return false;
  
  const notification = value as Record<string, unknown>;
  
  return (
    typeof notification.id === 'string' &&
    isNotificationType(notification.type) &&
    typeof notification.message === 'string' &&
    typeof notification.timestamp === 'number'
  );
};

// =============================================================================
// EXPORT STATEMENT
// =============================================================================

/**
 * Re-export all types for convenient imports
 */
export type {
  // Core types
  NotificationType as AlertType, // Backward compatibility alias
  NotificationPosition,
  NotificationVariant,
  NotificationDuration,
  
  // Data structures
  Notification,
  NotificationAction,
  NotificationConfig,
  
  // Queue management
  NotificationQueueConfig,
  NotificationQueueState,
  
  // Hook interfaces
  UseNotificationsReturn,
  
  // Context types
  NotificationContextValue,
  NotificationProviderProps,
  
  // Accessibility
  NotificationAriaConfig,
  NotificationKeyboardConfig,
  
  // Persistence
  NotificationPersistence,
  
  // Migration compatibility
  DfSnackbarCompatibility,
  NotificationServiceCompatibility,
  
  // Event handlers
  NotificationEventHandlers,
  
  // Testing
  NotificationTestUtils,
  
  // Utility types
  NotificationIdGenerator,
  NotificationFilter,
  NotificationSort,
};