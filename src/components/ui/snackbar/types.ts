/**
 * Snackbar Notification System Types for DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript 5.8+ type definitions for the snackbar notification system.
 * Provides type safety for notification queue management, accessibility compliance,
 * and seamless integration with Zustand state management and React component patterns.
 * 
 * Replaces Angular Material Snackbar types with modern React/Tailwind CSS equivalents
 * while maintaining functional parity per Section 0.2.6 minimal change requirements.
 */

import { ReactNode, ComponentType, HTMLAttributes } from 'react';
import { BaseComponent, ComponentVariant, ComponentSize } from '@/types/ui';

// ============================================================================
// ALERT SEVERITY TYPES - MATCHING ANGULAR IMPLEMENTATION
// ============================================================================

/**
 * Alert severity types matching existing Angular implementation
 * Maintains functional parity with Angular Material Snackbar severity levels
 * per Section 0.2.6 minimal change requirements
 */
export enum AlertType {
  SUCCESS = 'success',
  WARNING = 'warning', 
  ERROR = 'error',
  INFO = 'info'
}

/**
 * Alert severity union type for stricter type checking
 * Provides TypeScript 5.8+ enhanced literal type support
 */
export type AlertSeverity = AlertType | 'success' | 'warning' | 'error' | 'info';

/**
 * Alert severity with enhanced metadata for UI rendering
 * Includes WCAG 2.1 AA compliant color mappings and accessibility properties
 */
export interface AlertSeverityConfig {
  type: AlertType;
  label: string;
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  color: {
    bg: string;           // Background color - WCAG 2.1 AA compliant
    text: string;         // Text color - minimum 4.5:1 contrast ratio
    border: string;       // Border color - minimum 3:1 contrast ratio for UI components
    icon: string;         // Icon color
  };
  darkMode: {
    bg: string;
    text: string;
    border: string;
    icon: string;
  };
  ariaLabel: string;      // Screen reader label for severity
  announceText: string;   // Screen reader announcement text
}

// ============================================================================
// SNACKBAR POSITIONING AND DURATION TYPES
// ============================================================================

/**
 * Snackbar positioning options following design system patterns
 * Enhanced with mobile-responsive considerations
 */
export type SnackbarPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'
  | 'center';

/**
 * Duration configuration for snackbar display
 * Includes accessibility considerations for screen reader announcements
 */
export interface DurationConfig {
  /**
   * Display duration in milliseconds
   * Minimum 4000ms for WCAG 2.1 AA compliance (adequate reading time)
   */
  duration: number;
  
  /**
   * Whether notification persists until manually dismissed
   * Important for error messages requiring user acknowledgment
   */
  persistent?: boolean;
  
  /**
   * Auto-dismiss delay for non-persistent notifications
   * Default: 6000ms for accessibility compliance
   */
  autoHideDelay?: number;
  
  /**
   * Pause auto-hide on hover for accessibility
   * Allows users more time to read content
   */
  pauseOnHover?: boolean;
  
  /**
   * Pause auto-hide when focused for keyboard navigation
   */
  pauseOnFocus?: boolean;
}

/**
 * Responsive positioning configuration
 * Adapts to different screen sizes per mobile-first design
 */
export interface ResponsivePositioning {
  mobile: SnackbarPosition;     // < 768px
  tablet: SnackbarPosition;     // 768px - 1023px  
  desktop: SnackbarPosition;    // >= 1024px
  
  /**
   * Safe area adjustments for mobile devices
   * Accounts for notches, home indicators, etc.
   */
  safePadding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

// ============================================================================
// ACTION BUTTON AND INTERACTION TYPES
// ============================================================================

/**
 * Action button configuration for snackbar interactions
 * Follows WCAG 2.1 AA guidelines for touch targets and contrast
 */
export interface SnackbarAction {
  /**
   * Action button label
   * Must be descriptive for screen readers
   */
  label: string;
  
  /**
   * Action handler function
   * Called when action button is clicked/activated
   */
  handler: () => void | Promise<void>;
  
  /**
   * Button variant following design system
   */
  variant?: ComponentVariant;
  
  /**
   * Button size - minimum 44x44px for touch accessibility
   */
  size?: ComponentSize;
  
  /**
   * Loading state for async actions
   */
  loading?: boolean;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Icon component for visual enhancement
   */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /**
   * Icon position relative to label
   */
  iconPosition?: 'left' | 'right';
  
  // Accessibility properties
  /**
   * ARIA label for screen readers
   * Overrides label if more descriptive text needed
   */
  ariaLabel?: string;
  
  /**
   * ARIA description for additional context
   */
  ariaDescription?: string;
  
  /**
   * Keyboard shortcut for action
   * e.g., 'Enter', 'Escape', 'Ctrl+Z'
   */
  keyboardShortcut?: string;
  
  /**
   * Screen reader announcement when action is performed
   */
  announceOnPress?: string;
}

/**
 * Dismiss/close action configuration
 * Enhanced with accessibility considerations
 */
export interface DismissAction {
  /**
   * Whether dismiss button is shown
   * Default: true for accessibility
   */
  showDismiss?: boolean;
  
  /**
   * Custom dismiss icon
   */
  dismissIcon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  
  /**
   * Dismiss button label for screen readers
   */
  dismissLabel?: string;
  
  /**
   * Custom dismiss handler
   * Called before default dismiss behavior
   */
  onDismiss?: () => void | Promise<void>;
  
  /**
   * Whether clicking outside dismisses the snackbar
   */
  dismissOnClickOutside?: boolean;
  
  /**
   * Whether escape key dismisses the snackbar
   */
  dismissOnEscape?: boolean;
  
  /**
   * Keyboard shortcuts for dismissal
   */
  keyboardShortcuts?: string[];
}

// ============================================================================
// NOTIFICATION DATA AND QUEUE MANAGEMENT TYPES
// ============================================================================

/**
 * Core notification data structure for Zustand store integration
 * Provides comprehensive state management for notification queue
 */
export interface NotificationData {
  /**
   * Unique identifier for the notification
   * Used for queue management and React keys
   */
  id: string;
  
  /**
   * Primary notification message
   * Required - main content displayed to user
   */
  message: string;
  
  /**
   * Alert severity/type
   * Determines visual styling and accessibility properties
   */
  type: AlertType;
  
  /**
   * Detailed description or secondary content
   * Optional - provides additional context
   */
  description?: string;
  
  /**
   * Creation timestamp
   * Used for queue ordering and analytics
   */
  timestamp: number;
  
  /**
   * Duration configuration
   * Controls auto-hide behavior and persistence
   */
  duration: DurationConfig;
  
  /**
   * Whether notification can be manually dismissed
   * Important for required acknowledgments
   */
  dismissible: boolean;
  
  /**
   * Current state of the notification
   */
  state: NotificationState;
  
  /**
   * Priority level for queue ordering
   * Higher priority notifications appear first
   */
  priority: NotificationPriority;
  
  /**
   * Action buttons configuration
   */
  actions?: SnackbarAction[];
  
  /**
   * Dismiss configuration
   */
  dismiss?: DismissAction;
  
  /**
   * Custom positioning for this notification
   * Overrides global positioning settings
   */
  position?: SnackbarPosition | ResponsivePositioning;
  
  /**
   * Custom styling/theming
   */
  styling?: NotificationStyling;
  
  /**
   * Metadata for analytics and debugging
   */
  metadata?: {
    source?: string;          // Component or service that created notification
    context?: string;         // User action that triggered notification
    category?: string;        // Grouping for analytics
    tags?: string[];          // Additional classification
    userId?: string;          // Associated user (for audit logs)
    sessionId?: string;       // Session tracking
  };
  
  // Accessibility enhancements
  /**
   * ARIA live region politeness level
   * Controls urgency of screen reader announcements
   */
  ariaLive?: 'off' | 'polite' | 'assertive';
  
  /**
   * Whether to announce message to screen readers
   */
  announce?: boolean;
  
  /**
   * Custom announcement text for screen readers
   * Overrides default message if more descriptive
   */
  announceText?: string;
  
  /**
   * ARIA atomic - whether entire content should be announced as single unit
   */
  ariaAtomic?: boolean;
  
  /**
   * ARIA relevant - what changes should be announced
   */
  ariaRelevant?: 'additions' | 'removals' | 'text' | 'all';
}

/**
 * Notification lifecycle states
 * Tracks notification progression through display cycle
 */
export enum NotificationState {
  QUEUED = 'queued',           // Waiting to be displayed
  ENTERING = 'entering',       // Animation in progress
  VISIBLE = 'visible',         // Fully displayed and active
  PAUSED = 'paused',          // Auto-hide paused (hover/focus)
  EXITING = 'exiting',        // Dismissal animation in progress
  DISMISSED = 'dismissed',     // Removed from display
  ERROR = 'error'             // Failed to display
}

/**
 * Notification priority levels for queue management
 * Higher priority notifications bypass queue order
 */
export enum NotificationPriority {
  LOW = 0,                    // Background notifications
  NORMAL = 1,                 // Standard user feedback
  HIGH = 2,                   // Important warnings
  CRITICAL = 3,               // Errors requiring immediate attention
  URGENT = 4                  // System-critical alerts
}

/**
 * Queue management configuration
 * Controls global notification behavior
 */
export interface NotificationQueueConfig {
  /**
   * Maximum number of notifications displayed simultaneously
   * Prevents UI overflow and cognitive overload
   */
  maxVisible: number;
  
  /**
   * Maximum queue size before dropping old notifications
   * Prevents memory issues with long-running sessions
   */
  maxQueueSize: number;
  
  /**
   * Default position for new notifications
   */
  defaultPosition: SnackbarPosition | ResponsivePositioning;
  
  /**
   * Default duration configuration
   */
  defaultDuration: DurationConfig;
  
  /**
   * Global animation settings
   */
  animation: {
    enterDuration: number;    // Entrance animation duration (ms)
    exitDuration: number;     // Exit animation duration (ms)
    enterEasing: string;      // CSS easing function for entrance
    exitEasing: string;       // CSS easing function for exit
    staggerDelay: number;     // Delay between multiple notifications (ms)
  };
  
  /**
   * Stacking behavior when multiple notifications are shown
   */
  stacking: {
    direction: 'up' | 'down';           // Stacking direction
    overlap: boolean;                   // Whether notifications can overlap
    maxStack: number;                   // Maximum stacked notifications
    spacing: number;                    // Spacing between stacked items (px)
  };
  
  /**
   * Auto-cleanup configuration
   */
  cleanup: {
    enabled: boolean;                   // Auto-cleanup dismissed notifications
    delay: number;                      // Delay before cleanup (ms)
    maxRetained: number;                // Max dismissed notifications to retain
  };
  
  /**
   * Duplicate handling
   */
  duplicates: {
    prevent: boolean;                   // Prevent duplicate messages
    mergeStrategy: 'replace' | 'stack' | 'extend'; // How to handle duplicates
    timeWindow: number;                 // Time window for duplicate detection (ms)
  };
}

// ============================================================================
// STYLING AND THEMING TYPES
// ============================================================================

/**
 * Custom styling configuration for notifications
 * Provides Tailwind CSS integration with theme-aware utilities
 */
export interface NotificationStyling {
  /**
   * Container styling
   */
  container?: {
    className?: string;       // Custom Tailwind classes
    style?: React.CSSProperties; // Inline styles for dynamic values
    padding?: string;         // Custom padding override
    margin?: string;          // Custom margin override
    borderRadius?: string;    // Custom border radius
    maxWidth?: string;        // Custom max width
    minWidth?: string;        // Custom min width
  };
  
  /**
   * Content area styling
   */
  content?: {
    className?: string;
    style?: React.CSSProperties;
    typography?: {
      message?: string;       // Typography classes for message
      description?: string;   // Typography classes for description
    };
  };
  
  /**
   * Icon styling
   */
  icon?: {
    className?: string;
    style?: React.CSSProperties;
    size?: ComponentSize;
    position?: 'left' | 'top' | 'none';
  };
  
  /**
   * Action buttons styling
   */
  actions?: {
    container?: string;       // Actions container classes
    button?: string;          // Individual button classes
    spacing?: string;         // Spacing between actions
  };
  
  /**
   * Animation overrides
   */
  animation?: {
    enter?: string;           // Custom entrance animation
    exit?: string;            // Custom exit animation
    duration?: number;        // Animation duration override
  };
  
  /**
   * Theme variant override
   */
  variant?: ComponentVariant;
  
  /**
   * Size override
   */
  size?: ComponentSize;
  
  /**
   * Dark mode specific overrides
   */
  darkMode?: {
    container?: string;
    content?: string;
    icon?: string;
    actions?: string;
  };
}

/**
 * Theme-aware color scheme for notifications
 * Integrates with design system color tokens
 */
export interface NotificationTheme {
  light: {
    [K in AlertType]: {
      background: string;     // Background color (WCAG AA compliant)
      text: string;          // Text color (4.5:1 contrast minimum)
      border: string;        // Border color (3:1 contrast minimum)
      icon: string;          // Icon color
      accent: string;        // Accent/highlight color
    }
  };
  dark: {
    [K in AlertType]: {
      background: string;
      text: string;
      border: string;
      icon: string;
      accent: string;
    }
  };
}

// ============================================================================
// MAIN SNACKBAR COMPONENT TYPES
// ============================================================================

/**
 * Comprehensive snackbar component props interface
 * Provides complete type safety for all snackbar functionality
 */
export interface SnackbarProps extends BaseComponent {
  /**
   * Primary notification message (required)
   */
  message: string;
  
  /**
   * Alert type/severity
   */
  alertType: AlertType;
  
  /**
   * Optional detailed description
   */
  description?: string;
  
  /**
   * Display duration configuration
   */
  duration?: DurationConfig;
  
  /**
   * Action buttons configuration
   */
  actions?: SnackbarAction[];
  
  /**
   * Dismiss configuration
   */
  dismiss?: DismissAction;
  
  /**
   * Positioning configuration
   */
  position?: SnackbarPosition | ResponsivePositioning;
  
  /**
   * Priority for queue management
   */
  priority?: NotificationPriority;
  
  /**
   * Custom styling overrides
   */
  styling?: NotificationStyling;
  
  /**
   * Visibility state
   */
  open?: boolean;
  
  /**
   * Callback when notification is dismissed
   */
  onDismiss?: (id: string, reason: DismissReason) => void;
  
  /**
   * Callback when action is performed
   */
  onAction?: (actionIndex: number, action: SnackbarAction) => void;
  
  /**
   * Callback when notification state changes
   */
  onStateChange?: (state: NotificationState) => void;
  
  // Enhanced accessibility props
  /**
   * ARIA live region politeness
   */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /**
   * ARIA atomic behavior
   */
  'aria-atomic'?: boolean;
  
  /**
   * ARIA relevant changes
   */
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
  
  /**
   * Custom ARIA label
   */
  'aria-label'?: string;
  
  /**
   * ARIA described by reference
   */
  'aria-describedby'?: string;
  
  /**
   * Role override for accessibility
   */
  role?: 'alert' | 'status' | 'log' | 'none';
  
  /**
   * Whether to announce to screen readers
   */
  announceMessage?: boolean;
  
  /**
   * Custom announcement text
   */
  announceText?: string;
  
  /**
   * Focus management options
   */
  focus?: {
    autoFocus?: boolean;      // Auto-focus notification on appear
    trapFocus?: boolean;      // Trap focus within notification
    restoreFocus?: boolean;   // Restore focus on dismiss
    initialFocus?: React.RefObject<HTMLElement>; // Element to focus initially
  };
  
  /**
   * Keyboard navigation configuration
   */
  keyboard?: {
    enabled?: boolean;        // Enable keyboard navigation
    shortcuts?: {
      dismiss?: string[];     // Keys to dismiss (default: ['Escape'])
      actions?: string[];     // Keys to activate primary action
      navigation?: string[];  // Keys for action navigation
    };
  };
}

/**
 * Dismiss reason enumeration
 * Provides context for why notification was dismissed
 */
export enum DismissReason {
  USER_ACTION = 'user_action',        // User clicked dismiss button
  AUTO_HIDE = 'auto_hide',           // Auto-hide timer expired
  CLICK_OUTSIDE = 'click_outside',    // Clicked outside notification
  KEYBOARD = 'keyboard',             // Dismissed via keyboard
  PROGRAMMATIC = 'programmatic',     // Dismissed programmatically
  REPLACE = 'replace',               // Replaced by new notification
  QUEUE_OVERFLOW = 'queue_overflow', // Removed due to queue limits
  ERROR = 'error'                    // Error during display
}

// ============================================================================
// NOTIFICATION QUEUE OPERATIONS AND STORE INTEGRATION
// ============================================================================

/**
 * Notification queue operations for Zustand store integration
 * Provides type-safe methods for queue management
 */
export interface NotificationQueueOperations {
  /**
   * Add notification to queue
   */
  add: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'state'>) => string;
  
  /**
   * Remove notification by ID
   */
  remove: (id: string, reason?: DismissReason) => void;
  
  /**
   * Update notification by ID
   */
  update: (id: string, updates: Partial<NotificationData>) => void;
  
  /**
   * Clear all notifications
   */
  clear: (filterFn?: (notification: NotificationData) => boolean) => void;
  
  /**
   * Pause notification auto-hide
   */
  pause: (id: string) => void;
  
  /**
   * Resume notification auto-hide
   */
  resume: (id: string) => void;
  
  /**
   * Move notification to front of queue
   */
  prioritize: (id: string) => void;
  
  /**
   * Get notification by ID
   */
  get: (id: string) => NotificationData | undefined;
  
  /**
   * Get all notifications matching filter
   */
  getAll: (filterFn?: (notification: NotificationData) => boolean) => NotificationData[];
  
  /**
   * Get currently visible notifications
   */
  getVisible: () => NotificationData[];
  
  /**
   * Get queued notifications waiting to be displayed
   */
  getQueued: () => NotificationData[];
  
  /**
   * Check if notification with message already exists
   */
  exists: (message: string, timeWindow?: number) => boolean;
  
  /**
   * Get queue statistics
   */
  getStats: () => {
    total: number;
    visible: number;
    queued: number;
    byType: Record<AlertType, number>;
    byPriority: Record<NotificationPriority, number>;
  };
}

/**
 * Zustand store state interface for notification management
 * Integrates with global application state
 */
export interface NotificationStore {
  /**
   * Active notifications queue
   */
  notifications: NotificationData[];
  
  /**
   * Queue configuration
   */
  config: NotificationQueueConfig;
  
  /**
   * Theme configuration
   */
  theme: NotificationTheme;
  
  /**
   * Global enabled/disabled state
   */
  enabled: boolean;
  
  /**
   * Queue operations
   */
  operations: NotificationQueueOperations;
  
  /**
   * Update configuration
   */
  updateConfig: (config: Partial<NotificationQueueConfig>) => void;
  
  /**
   * Update theme
   */
  updateTheme: (theme: Partial<NotificationTheme>) => void;
  
  /**
   * Enable/disable notification system
   */
  setEnabled: (enabled: boolean) => void;
  
  /**
   * Reset store to initial state
   */
  reset: () => void;
}

// ============================================================================
// UTILITY TYPES AND HELPERS
// ============================================================================

/**
 * Notification factory helper types
 * Simplifies creation of common notification patterns
 */
export interface NotificationHelpers {
  /**
   * Create success notification
   */
  success: (message: string, options?: Partial<NotificationData>) => string;
  
  /**
   * Create warning notification
   */
  warning: (message: string, options?: Partial<NotificationData>) => string;
  
  /**
   * Create error notification
   */
  error: (message: string, options?: Partial<NotificationData>) => string;
  
  /**
   * Create info notification
   */
  info: (message: string, options?: Partial<NotificationData>) => string;
  
  /**
   * Create confirmation dialog notification
   */
  confirm: (message: string, onConfirm: () => void, onCancel?: () => void) => string;
  
  /**
   * Create loading notification with progress
   */
  loading: (message: string, options?: { 
    progress?: number; 
    onCancel?: () => void;
  }) => string;
  
  /**
   * Update loading notification
   */
  updateLoading: (id: string, updates: { 
    message?: string; 
    progress?: number; 
  }) => void;
  
  /**
   * Complete loading notification
   */
  completeLoading: (id: string, finalMessage?: string, finalType?: AlertType) => void;
}

/**
 * Conditional notification type
 * For programmatic notification creation
 */
export type ConditionalNotification = Partial<NotificationData> & {
  message: string;
  type: AlertType;
};

/**
 * Notification template type
 * For reusable notification patterns
 */
export interface NotificationTemplate {
  name: string;
  message: string;
  type: AlertType;
  duration?: DurationConfig;
  actions?: SnackbarAction[];
  styling?: NotificationStyling;
  metadata?: NotificationData['metadata'];
}

/**
 * Bulk notification operation type
 * For batch queue operations
 */
export interface BulkNotificationOperation {
  operation: 'add' | 'remove' | 'update' | 'clear';
  notifications?: ConditionalNotification[];
  filter?: (notification: NotificationData) => boolean;
  updates?: Partial<NotificationData>;
}

// ============================================================================
// EXPORTED TYPE COLLECTIONS
// ============================================================================

/**
 * Main export of all snackbar-related types
 * Provides convenient access to the complete type system
 */
export type {
  // Core component types
  SnackbarProps,
  NotificationData,
  NotificationStore,
  
  // Configuration types
  DurationConfig,
  ResponsivePositioning,
  NotificationQueueConfig,
  NotificationStyling,
  NotificationTheme,
  
  // Action and interaction types
  SnackbarAction,
  DismissAction,
  
  // Queue management types
  NotificationQueueOperations,
  NotificationHelpers,
  
  // Utility types
  ConditionalNotification,
  NotificationTemplate,
  BulkNotificationOperation,
  
  // Enums as types
  AlertSeverity,
  SnackbarPosition,
  NotificationState,
  NotificationPriority,
  DismissReason,
};

/**
 * Default export for main snackbar configuration
 */
export interface SnackbarConfig {
  queue: NotificationQueueConfig;
  theme: NotificationTheme;
  helpers: NotificationHelpers;
  operations: NotificationQueueOperations;
}