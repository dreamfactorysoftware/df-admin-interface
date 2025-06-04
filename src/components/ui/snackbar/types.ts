/**
 * Snackbar Notification System Type Definitions
 * 
 * Comprehensive TypeScript 5.8+ interface definitions for the snackbar notification system.
 * Provides type safety for notification queue management, accessibility compliance (WCAG 2.1 AA),
 * and seamless integration with Zustand store state and React 19 component patterns.
 * 
 * @fileoverview TypeScript type definitions for snackbar notifications
 * @version 1.0.0
 * @since React 19.0 / Next.js 15.1
 */

import { type ReactNode, type MouseEvent, type KeyboardEvent } from 'react';
import { type BaseComponentProps, type ThemeProps, type AccessibilityProps, type AnimationProps } from '@/types/ui';

/**
 * Alert severity levels matching existing Angular implementation
 * Preserves functionality during framework migration per Section 0.2.6 minimal change requirements
 */
export enum AlertType {
  SUCCESS = 'success',
  WARNING = 'warning', 
  ERROR = 'error',
  INFO = 'info'
}

/**
 * Union type for alert severity with strict type checking
 * Ensures compile-time validation of severity values
 */
export type AlertSeverity = `${AlertType}`;

/**
 * Duration configuration options for notification display
 * Supports accessibility requirements with extended durations for screen readers
 */
export interface DurationConfig {
  /** Base duration in milliseconds for notification display */
  base: number;
  /** Extended duration for accessibility (screen readers, reduced motion) */
  accessible: number;
  /** Minimum duration to ensure readability */
  minimum: number;
  /** Maximum duration before auto-dismiss */
  maximum: number;
}

/**
 * Predefined duration configurations for different alert types
 * Follows WCAG 2.1 guidelines for timing adjustments
 */
export type DurationPreset = 'short' | 'medium' | 'long' | 'persistent';

/**
 * Map of duration presets to actual configurations
 */
export interface DurationPresets {
  short: DurationConfig;
  medium: DurationConfig;
  long: DurationConfig;
  persistent: DurationConfig;
}

/**
 * Action button configuration for snackbar notifications
 * Supports accessibility attributes and keyboard navigation
 */
export interface SnackbarAction {
  /** Action button label text */
  label: string;
  /** Action handler function */
  handler: (notificationId: string) => void | Promise<void>;
  /** Button variant styling */
  variant?: 'text' | 'outlined' | 'contained';
  /** Button color theme */
  color?: 'primary' | 'secondary' | 'inherit';
  /** Accessibility label for screen readers */
  ariaLabel?: string;
  /** Keyboard shortcut key */
  hotkey?: string;
  /** Loading state for async actions */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Icon configuration for snackbar notifications
 * Supports custom icons and accessibility requirements
 */
export interface SnackbarIcon {
  /** Icon component or element */
  icon?: ReactNode;
  /** Hide default severity icon */
  hideDefault?: boolean;
  /** Custom icon color */
  color?: string;
  /** Icon accessibility label */
  ariaLabel?: string;
  /** Icon size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Position configuration for snackbar placement
 * Supports responsive positioning and accessibility considerations
 */
export interface SnackbarPosition {
  /** Vertical position */
  vertical: 'top' | 'bottom';
  /** Horizontal position */
  horizontal: 'left' | 'center' | 'right';
  /** Offset from edges in pixels */
  offset?: {
    x?: number;
    y?: number;
  };
  /** Responsive position overrides */
  responsive?: {
    mobile?: Partial<SnackbarPosition>;
    tablet?: Partial<SnackbarPosition>;
    desktop?: Partial<SnackbarPosition>;
  };
}

/**
 * Transition and animation configuration
 * Respects user's reduced motion preferences
 */
export interface SnackbarTransition {
  /** Transition type */
  type: 'slide' | 'fade' | 'scale' | 'zoom';
  /** Transition duration in milliseconds */
  duration: number;
  /** Transition easing function */
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  /** Respect reduced motion preference */
  respectReducedMotion: boolean;
  /** Custom transition CSS classes */
  customClasses?: {
    enter?: string;
    enterActive?: string;
    exit?: string;
    exitActive?: string;
  };
}

/**
 * Comprehensive notification data structure for Zustand store management
 * Includes all necessary properties for queue management and state tracking
 */
export interface NotificationData {
  /** Unique notification identifier */
  id: string;
  /** Notification message content */
  message: string;
  /** Alert severity type */
  alertType: AlertSeverity;
  /** Notification timestamp */
  timestamp: number;
  /** Auto-dismiss duration in milliseconds (null for persistent) */
  duration: number | null;
  /** User can manually dismiss notification */
  dismissible: boolean;
  /** Queue priority for ordering (higher numbers = higher priority) */
  priority: number;
  /** Notification has been read by user */
  read: boolean;
  /** Notification is currently visible */
  visible: boolean;
  /** Action buttons configuration */
  actions?: SnackbarAction[];
  /** Icon configuration */
  icon?: SnackbarIcon;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Source component or feature that created notification */
  source?: string;
  /** Notification category for filtering */
  category?: string;
  /** Stack multiple similar notifications */
  stackable?: boolean;
  /** Stack count for grouped notifications */
  stackCount?: number;
}

/**
 * Notification queue configuration and state management
 * Supports advanced queue management features for enterprise applications
 */
export interface NotificationQueue {
  /** Array of active notifications */
  notifications: NotificationData[];
  /** Maximum notifications to display simultaneously */
  maxVisible: number;
  /** Maximum notifications to store in queue */
  maxQueue: number;
  /** Queue processing strategy */
  strategy: 'fifo' | 'lifo' | 'priority';
  /** Auto-clear read notifications after delay */
  autoClearRead: boolean;
  /** Auto-clear delay in milliseconds */
  autoClearDelay: number;
  /** Pause queue processing */
  paused: boolean;
  /** Group similar notifications */
  groupSimilar: boolean;
  /** Similarity threshold for grouping */
  similarityThreshold: number;
}

/**
 * Snackbar store state interface for Zustand integration
 * Provides comprehensive state management for notification system
 */
export interface SnackbarStore {
  /** Notification queue state */
  queue: NotificationQueue;
  /** Global position configuration */
  position: SnackbarPosition;
  /** Global transition configuration */
  transition: SnackbarTransition;
  /** Duration presets configuration */
  durations: DurationPresets;
  /** Store is initialized */
  initialized: boolean;
  
  // Action methods
  /** Add notification to queue */
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'visible'>) => string;
  /** Remove notification by ID */
  removeNotification: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Clear notifications by type */
  clearByType: (alertType: AlertSeverity) => void;
  /** Clear notifications by source */
  clearBySource: (source: string) => void;
  /** Mark notification as read */
  markAsRead: (id: string) => void;
  /** Mark all notifications as read */
  markAllAsRead: () => void;
  /** Update notification data */
  updateNotification: (id: string, updates: Partial<NotificationData>) => void;
  /** Pause/resume queue processing */
  pauseQueue: (paused: boolean) => void;
  /** Update global configuration */
  updateConfig: (config: Partial<{
    position: SnackbarPosition;
    transition: SnackbarTransition;
    durations: DurationPresets;
  }>) => void;
}

/**
 * Core snackbar component props interface
 * Extends base component patterns with notification-specific properties
 */
export interface SnackbarProps extends 
  BaseComponentProps<HTMLDivElement>,
  ThemeProps,
  AccessibilityProps,
  AnimationProps {
  
  /** Notification data to display */
  notification: NotificationData;
  /** Notification is open/visible */
  open: boolean;
  /** Close/dismiss handler */
  onClose: (notificationId: string, reason?: SnackbarCloseReason) => void;
  /** Action button click handler */
  onActionClick?: (action: SnackbarAction, notificationId: string) => void;
  /** Animation complete handler */
  onAnimationComplete?: (notificationId: string, phase: 'enter' | 'exit') => void;
  
  /** Position override for individual notification */
  position?: SnackbarPosition;
  /** Transition override for individual notification */
  transition?: SnackbarTransition;
  /** Custom styling classes */
  classes?: {
    root?: string;
    message?: string;
    actions?: string;
    icon?: string;
    closeButton?: string;
  };
  
  /** Show close button */
  showCloseButton?: boolean;
  /** Close button accessibility label */
  closeButtonAriaLabel?: string;
  /** Custom close button icon */
  closeButtonIcon?: ReactNode;
  
  /** Compact display mode */
  compact?: boolean;
  /** Full width display */
  fullWidth?: boolean;
  /** Elevation/shadow level */
  elevation?: 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24;
}

/**
 * Snackbar close reasons for analytics and behavior tracking
 */
export type SnackbarCloseReason = 
  | 'timeout'           // Auto-dismiss timeout
  | 'clickaway'         // Click outside notification
  | 'escapeKeyDown'     // Escape key pressed
  | 'closeButton'       // Close button clicked
  | 'action'            // Action button triggered close
  | 'programmatic'      // Closed via code
  | 'maxQueue'          // Removed due to queue limit
  | 'user';             // Generic user interaction

/**
 * Event handlers for snackbar interactions
 * Supports comprehensive interaction tracking and analytics
 */
export interface SnackbarEventHandlers {
  /** Notification displayed */
  onShow?: (notification: NotificationData) => void;
  /** Notification hidden */
  onHide?: (notification: NotificationData, reason: SnackbarCloseReason) => void;
  /** Notification clicked */
  onClick?: (notification: NotificationData, event: MouseEvent) => void;
  /** Keyboard interaction */
  onKeyDown?: (notification: NotificationData, event: KeyboardEvent) => void;
  /** Action button clicked */
  onActionClick?: (action: SnackbarAction, notification: NotificationData) => void;
  /** Hover state changed */
  onHover?: (notification: NotificationData, hovered: boolean) => void;
  /** Focus state changed */
  onFocus?: (notification: NotificationData, focused: boolean) => void;
}

/**
 * Snackbar container props for managing multiple notifications
 * Handles positioning, stacking, and queue management
 */
export interface SnackbarContainerProps extends 
  BaseComponentProps<HTMLDivElement>,
  AccessibilityProps {
  
  /** Notifications to display */
  notifications: NotificationData[];
  /** Maximum visible notifications */
  maxVisible?: number;
  /** Position configuration */
  position?: SnackbarPosition;
  /** Spacing between notifications */
  spacing?: number;
  /** Stack direction for multiple notifications */
  stackDirection?: 'up' | 'down';
  /** Event handlers */
  eventHandlers?: SnackbarEventHandlers;
  /** Portal container element */
  container?: HTMLElement | null;
  /** Z-index for stacking context */
  zIndex?: number;
}

/**
 * Utility types for notification management
 */

/**
 * Notification builder for creating notifications with defaults
 */
export interface NotificationBuilder {
  /** Set message content */
  message(content: string): NotificationBuilder;
  /** Set alert type */
  type(alertType: AlertSeverity): NotificationBuilder;
  /** Set duration */
  duration(ms: number | null): NotificationBuilder;
  /** Add action button */
  action(action: SnackbarAction): NotificationBuilder;
  /** Set priority */
  priority(level: number): NotificationBuilder;
  /** Set source */
  source(source: string): NotificationBuilder;
  /** Set metadata */
  metadata(data: Record<string, any>): NotificationBuilder;
  /** Build final notification */
  build(): Omit<NotificationData, 'id' | 'timestamp' | 'visible'>;
}

/**
 * Notification filter criteria for queue operations
 */
export interface NotificationFilter {
  /** Filter by alert type */
  alertType?: AlertSeverity | AlertSeverity[];
  /** Filter by source */
  source?: string | string[];
  /** Filter by category */
  category?: string | string[];
  /** Filter by read status */
  read?: boolean;
  /** Filter by timestamp range */
  timestampRange?: {
    from?: number;
    to?: number;
  };
  /** Custom filter function */
  custom?: (notification: NotificationData) => boolean;
}

/**
 * Notification sorting configuration
 */
export interface NotificationSort {
  /** Sort field */
  field: keyof NotificationData;
  /** Sort direction */
  direction: 'asc' | 'desc';
  /** Custom comparator function */
  comparator?: (a: NotificationData, b: NotificationData) => number;
}

/**
 * Queue operation result
 */
export interface QueueOperationResult {
  /** Operation was successful */
  success: boolean;
  /** Number of notifications affected */
  affected: number;
  /** Error message if operation failed */
  error?: string;
  /** Notifications that were affected */
  notifications?: NotificationData[];
}

/**
 * Notification analytics data
 */
export interface NotificationAnalytics {
  /** Total notifications created */
  totalCreated: number;
  /** Total notifications dismissed */
  totalDismissed: number;
  /** Total actions triggered */
  totalActions: number;
  /** Average display duration */
  averageDisplayDuration: number;
  /** Dismiss reasons breakdown */
  dismissReasons: Record<SnackbarCloseReason, number>;
  /** Most active sources */
  sourceActivity: Record<string, number>;
  /** Alert type distribution */
  alertTypeDistribution: Record<AlertSeverity, number>;
}

/**
 * Theme configuration for snackbar styling
 * Compatible with Tailwind CSS utility classes and design tokens
 */
export interface SnackbarTheme {
  /** Alert type specific styling */
  alertTypes: {
    [K in AlertSeverity]: {
      /** Background color classes */
      background: string;
      /** Text color classes */
      text: string;
      /** Border color classes */
      border: string;
      /** Icon color classes */
      icon: string;
      /** Progress bar color (for timed notifications) */
      progress: string;
    };
  };
  /** Default component styling */
  components: {
    /** Root container classes */
    root: string;
    /** Message content classes */
    message: string;
    /** Actions container classes */
    actions: string;
    /** Close button classes */
    closeButton: string;
    /** Icon container classes */
    icon: string;
    /** Progress bar classes */
    progress: string;
  };
  /** Dark mode overrides */
  darkMode: {
    /** Dark mode alert type styling */
    alertTypes: {
      [K in AlertSeverity]: Partial<SnackbarTheme['alertTypes'][K]>;
    };
    /** Dark mode component styling */
    components: Partial<SnackbarTheme['components']>;
  };
}

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 */
export interface SnackbarAccessibility {
  /** Announce notifications to screen readers */
  announceToScreenReader: boolean;
  /** Live region politeness setting */
  liveRegionPoliteness: 'polite' | 'assertive' | 'off';
  /** Focus management strategy */
  focusManagement: 'none' | 'first-action' | 'container';
  /** High contrast mode support */
  highContrastMode: boolean;
  /** Respect reduced motion preferences */
  respectReducedMotion: boolean;
  /** Keyboard navigation support */
  keyboardNavigation: boolean;
  /** Voice control support */
  voiceControlSupport: boolean;
  /** Custom accessibility attributes */
  customAttributes?: Record<string, string>;
}

/**
 * Export consolidated notification configuration
 */
export interface SnackbarConfiguration {
  /** Queue management settings */
  queue: Partial<NotificationQueue>;
  /** Position settings */
  position: SnackbarPosition;
  /** Transition settings */
  transition: SnackbarTransition;
  /** Duration presets */
  durations: DurationPresets;
  /** Theme configuration */
  theme: SnackbarTheme;
  /** Accessibility configuration */
  accessibility: SnackbarAccessibility;
  /** Event handlers */
  eventHandlers?: SnackbarEventHandlers;
}

/**
 * Type guards for runtime type checking
 */
export const isValidAlertType = (value: any): value is AlertSeverity => {
  return Object.values(AlertType).includes(value);
};

export const isNotificationData = (value: any): value is NotificationData => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    typeof value.message === 'string' &&
    isValidAlertType(value.alertType) &&
    typeof value.timestamp === 'number'
  );
};

/**
 * Default configuration values
 */
export const DEFAULT_DURATION_PRESETS: DurationPresets = {
  short: {
    base: 3000,
    accessible: 5000,
    minimum: 2000,
    maximum: 8000
  },
  medium: {
    base: 5000,
    accessible: 8000,
    minimum: 3000,
    maximum: 12000
  },
  long: {
    base: 8000,
    accessible: 12000,
    minimum: 5000,
    maximum: 20000
  },
  persistent: {
    base: Infinity,
    accessible: Infinity,
    minimum: Infinity,
    maximum: Infinity
  }
};

export const DEFAULT_POSITION: SnackbarPosition = {
  vertical: 'bottom',
  horizontal: 'left',
  offset: { x: 16, y: 16 }
};

export const DEFAULT_TRANSITION: SnackbarTransition = {
  type: 'slide',
  duration: 300,
  easing: 'ease-out',
  respectReducedMotion: true
};