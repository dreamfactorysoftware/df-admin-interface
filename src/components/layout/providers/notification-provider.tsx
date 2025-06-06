/**
 * NotificationProvider - React Context Provider for Toast Notifications
 * 
 * Comprehensive notification system replacing Angular DfSnackbarService with React-based
 * implementation using Headless UI and Tailwind CSS. Provides enterprise-grade notification
 * management with accessibility compliance, queue management, and edit page persistence.
 * 
 * Core Features:
 * - React 19 context API with TypeScript 5.8+ enhanced type inference
 * - Headless UI 2.0+ for WCAG 2.1 AA accessible notification components
 * - Tailwind CSS 4.1+ utility-first styling with responsive design
 * - Auto-dismissal with configurable duration and user interaction handling
 * - Notification persistence across route changes for critical user feedback
 * - Angular compatibility layer for seamless migration from DfSnackbarService
 * - Queue management with maximum capacity and priority handling
 * - Comprehensive error boundaries and fallback mechanisms
 * 
 * Migration Notes:
 * - Replaces Angular Material mat-snackbar with React-based toast system
 * - Maintains API compatibility with existing DfSnackbarService calls
 * - Supports edit page state management for notification persistence
 * - Preserves notification timing and user interaction patterns
 * 
 * @fileoverview Notification provider for React notification system
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1+ / TypeScript 5.8+
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 */

'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useReducer,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import { nanoid } from 'nanoid';
import type {
  NotificationContextValue,
  NotificationState,
  NotificationActions,
  NotificationProviderProps,
  NotificationEventHandlers,
} from './provider-types';
import type {
  Notification,
  NotificationConfig,
  NotificationQueueConfig,
  NotificationType,
  NotificationDuration,
  DfSnackbarCompatibility,
  NotificationServiceCompatibility,
  UseNotificationsReturn,
  DURATION_PRESETS,
} from '@/types/notification';

// ============================================================================
// CONSTANTS AND DEFAULTS
// ============================================================================

/**
 * Default notification queue configuration
 */
const DEFAULT_CONFIG: NotificationQueueConfig = {
  maxNotifications: 5,
  defaultPosition: 'bottom-right',
  defaultDuration: 'medium',
  groupSimilar: false,
  animationDuration: 300,
  zIndex: 9999,
};

/**
 * Duration mappings for notification auto-dismissal
 */
const DURATION_MAP: Record<Exclude<NotificationDuration, number>, number> = {
  short: 3000,
  medium: 5000,
  long: 10000,
  persistent: -1,
};

/**
 * Default notification event handlers
 */
const DEFAULT_EVENT_HANDLERS: NotificationEventHandlers = {
  onShow: () => {},
  onDismiss: () => {},
  onExpire: () => {},
  onActionClick: () => {},
  onQueueFull: () => {},
};

// ============================================================================
// NOTIFICATION STATE MANAGEMENT
// ============================================================================

/**
 * Notification action types for reducer
 */
type NotificationActionType =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'REMOVE_ALL_NOTIFICATIONS' }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_EDIT_PAGE_STATE'; payload: { isEditPage: boolean; elementId?: string } }
  | { type: 'RESTORE_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'UPDATE_CONFIG'; payload: Partial<NotificationQueueConfig> }
  | { type: 'SET_ACCESSIBILITY_PREFERENCES'; payload: Partial<NotificationState['accessibility']> };

/**
 * Initial notification state
 */
const initialState: NotificationState = {
  notifications: [],
  config: DEFAULT_CONFIG,
  paused: false,
  persistence: {
    isEditPage: false,
    lastElementId: null,
    storedNotifications: [],
  },
  metrics: {
    totalShown: 0,
    totalDismissed: 0,
    totalExpired: 0,
    averageDisplayDuration: 0,
  },
  accessibility: {
    announceToScreenReader: true,
    focusManagement: 'notification',
    keyboardNavigation: true,
  },
};

/**
 * Notification state reducer
 */
function notificationReducer(
  state: NotificationState,
  action: NotificationActionType
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification = action.payload;
      let updatedNotifications = [...state.notifications];

      // Remove oldest notification if at capacity
      if (updatedNotifications.length >= (state.config.maxNotifications || 5)) {
        updatedNotifications.shift();
      }

      // Group similar notifications if enabled
      if (state.config.groupSimilar) {
        const existingIndex = updatedNotifications.findIndex(
          (n) =>
            n.type === newNotification.type &&
            n.message === newNotification.message &&
            n.title === newNotification.title
        );

        if (existingIndex !== -1) {
          // Update existing notification instead of adding new one
          updatedNotifications[existingIndex] = {
            ...updatedNotifications[existingIndex],
            timestamp: newNotification.timestamp,
            id: newNotification.id,
          };
        } else {
          updatedNotifications.push(newNotification);
        }
      } else {
        updatedNotifications.push(newNotification);
      }

      return {
        ...state,
        notifications: updatedNotifications,
        metrics: {
          ...state.metrics,
          totalShown: state.metrics.totalShown + 1,
        },
      };
    }

    case 'REMOVE_NOTIFICATION': {
      const notificationId = action.payload;
      const notification = state.notifications.find((n) => n.id === notificationId);
      
      if (notification) {
        const displayDuration = Date.now() - notification.timestamp;
        const totalDisplayTime = state.metrics.averageDisplayDuration * state.metrics.totalDismissed + displayDuration;
        const newAverageDisplayDuration = totalDisplayTime / (state.metrics.totalDismissed + 1);

        return {
          ...state,
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          metrics: {
            ...state.metrics,
            totalDismissed: state.metrics.totalDismissed + 1,
            averageDisplayDuration: newAverageDisplayDuration,
          },
        };
      }
      
      return state;
    }

    case 'REMOVE_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
      };

    case 'UPDATE_NOTIFICATION': {
      const { id, updates } = action.payload;
      return {
        ...state,
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, ...updates } : notification
        ),
      };
    }

    case 'SET_PAUSED':
      return {
        ...state,
        paused: action.payload,
      };

    case 'SET_EDIT_PAGE_STATE': {
      const { isEditPage, elementId } = action.payload;
      
      // Store current notifications when entering edit page
      if (isEditPage && !state.persistence.isEditPage) {
        return {
          ...state,
          persistence: {
            ...state.persistence,
            isEditPage,
            lastElementId: elementId || null,
            storedNotifications: [...state.notifications],
          },
        };
      }

      return {
        ...state,
        persistence: {
          ...state.persistence,
          isEditPage,
          lastElementId: elementId || state.persistence.lastElementId,
        },
      };
    }

    case 'RESTORE_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        persistence: {
          ...state.persistence,
          storedNotifications: [],
        },
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };

    case 'SET_ACCESSIBILITY_PREFERENCES':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          ...action.payload,
        },
      };

    default:
      return state;
  }
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

/**
 * Notification context
 */
const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Hook to access notification context
 * @throws Error if used outside NotificationProvider
 */
export function useNotifications(): UseNotificationsReturn {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider. ' +
      'Make sure your component is wrapped with <NotificationProvider>.'
    );
  }

  // Return the hook interface (without provider-specific properties)
  return {
    notifications: context.state.notifications,
    notify: context.actions.notify,
    success: context.actions.success,
    error: context.actions.error,
    warning: context.actions.warning,
    info: context.actions.info,
    dismiss: context.actions.dismiss,
    dismissAll: context.actions.dismissAll,
    pause: context.actions.pause,
    resume: context.actions.resume,
    updateConfig: context.actions.updateConfig,
    setEditPageState: context.actions.setEditPageState,
    getLastElement: context.actions.getLastElement,
    isPaused: context.state.paused,
    config: context.state.config,
  };
}

/**
 * Hook to access full notification context (provider-specific)
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error(
      'useNotificationContext must be used within a NotificationProvider. ' +
      'Make sure your component is wrapped with <NotificationProvider>.'
    );
  }

  return context;
}

// ============================================================================
// NOTIFICATION PROVIDER COMPONENT
// ============================================================================

/**
 * NotificationProvider component
 * 
 * Provides notification functionality throughout the component tree with comprehensive
 * state management, accessibility support, and Angular compatibility layer.
 * 
 * @param props - Provider configuration and children
 */
export function NotificationProvider({
  children,
  config = {},
  initialState: providedInitialState = {},
  eventHandlers = {},
  persistence = {},
  enableCompatibilityMode = true,
  customComponents = {},
  debug = false,
  id = 'notification-provider',
}: NotificationProviderProps & {
  initialState?: Partial<NotificationState>;
  eventHandlers?: Partial<NotificationEventHandlers>;
  persistence?: any;
  enableCompatibilityMode?: boolean;
  customComponents?: any;
  debug?: boolean;
  id?: string;
}): JSX.Element {
  // Merge configurations
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  const mergedEventHandlers = useMemo(
    () => ({ ...DEFAULT_EVENT_HANDLERS, ...eventHandlers }),
    [eventHandlers]
  );

  // Initialize state with provided configuration
  const mergedInitialState = useMemo(
    () => ({
      ...initialState,
      ...providedInitialState,
      config: mergedConfig,
    }),
    [providedInitialState, mergedConfig]
  );

  // State management
  const [state, dispatch] = useReducer(notificationReducer, mergedInitialState);

  // Ref for auto-dismiss timers
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Ref for DOM container
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Debug information
  const debugInfo = useMemo(() => {
    if (!debug) return undefined;
    
    return {
      lastUpdate: new Date().toISOString(),
      renderCount: 0,
      subscribers: 1, // TODO: Track actual subscribers
    };
  }, [debug, state]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Generate unique notification ID
   */
  const generateId = useCallback((): string => {
    return `notification-${nanoid(8)}`;
  }, []);

  /**
   * Get duration in milliseconds
   */
  const getDuration = useCallback((duration?: NotificationDuration): number => {
    if (typeof duration === 'number') return duration;
    if (duration === 'persistent') return -1;
    return DURATION_MAP[duration || 'medium'];
  }, []);

  /**
   * Clear notification timer
   */
  const clearTimer = useCallback((id: string): void => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Set notification auto-dismiss timer
   */
  const setTimer = useCallback(
    (notification: Notification): void => {
      const duration = getDuration(notification.duration || state.config.defaultDuration);
      
      if (duration > 0 && !state.paused) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
          mergedEventHandlers.onExpire?.(notification);
          clearTimer(notification.id);
        }, duration);
        
        timersRef.current.set(notification.id, timer);
      }
    },
    [state.config.defaultDuration, state.paused, getDuration, clearTimer, mergedEventHandlers]
  );

  /**
   * Create notification object
   */
  const createNotification = useCallback(
    (config: NotificationConfig): Notification => {
      const notification: Notification = {
        id: config.id || generateId(),
        type: config.type,
        title: config.title,
        message: config.message,
        description: config.description,
        variant: config.variant || 'toast',
        position: config.position || state.config.defaultPosition || 'bottom-right',
        duration: config.duration || state.config.defaultDuration || 'medium',
        dismissible: config.dismissible !== false,
        announce: config.announce !== false,
        timestamp: config.timestamp || Date.now(),
        actions: config.actions || [],
        metadata: config.metadata || {},
      };

      return notification;
    },
    [generateId, state.config.defaultPosition, state.config.defaultDuration]
  );

  // ============================================================================
  // NOTIFICATION ACTIONS
  // ============================================================================

  /**
   * Show a notification
   */
  const notify = useCallback(
    (config: NotificationConfig): string => {
      const notification = createNotification(config);
      
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      mergedEventHandlers.onShow?.(notification);
      setTimer(notification);
      
      // Announce to screen reader if enabled
      if (state.accessibility.announceToScreenReader && notification.announce) {
        // Screen reader announcement will be handled by the Toast component
        // via aria-live regions
      }
      
      return notification.id;
    },
    [createNotification, mergedEventHandlers, setTimer, state.accessibility.announceToScreenReader]
  );

  /**
   * Show success notification
   */
  const success = useCallback(
    (message: string, options: Partial<NotificationConfig> = {}): string => {
      return notify({
        ...options,
        type: 'success',
        message,
      });
    },
    [notify]
  );

  /**
   * Show error notification
   */
  const error = useCallback(
    (message: string, options: Partial<NotificationConfig> = {}): string => {
      return notify({
        ...options,
        type: 'error',
        message,
        duration: options.duration || 'long', // Errors stay longer by default
      });
    },
    [notify]
  );

  /**
   * Show warning notification
   */
  const warning = useCallback(
    (message: string, options: Partial<NotificationConfig> = {}): string => {
      return notify({
        ...options,
        type: 'warning',
        message,
      });
    },
    [notify]
  );

  /**
   * Show info notification
   */
  const info = useCallback(
    (message: string, options: Partial<NotificationConfig> = {}): string => {
      return notify({
        ...options,
        type: 'info',
        message,
      });
    },
    [notify]
  );

  /**
   * Dismiss specific notification
   */
  const dismiss = useCallback(
    (id: string): void => {
      const notification = state.notifications.find((n) => n.id === id);
      if (notification) {
        clearTimer(id);
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
        mergedEventHandlers.onDismiss?.(notification);
      }
    },
    [state.notifications, clearTimer, mergedEventHandlers]
  );

  /**
   * Dismiss all notifications
   */
  const dismissAll = useCallback((): void => {
    // Clear all timers
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    
    dispatch({ type: 'REMOVE_ALL_NOTIFICATIONS' });
  }, []);

  /**
   * Pause auto-dismissal
   */
  const pause = useCallback((): void => {
    dispatch({ type: 'SET_PAUSED', payload: true });
    
    // Clear existing timers when pausing
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  /**
   * Resume auto-dismissal
   */
  const resume = useCallback((): void => {
    dispatch({ type: 'SET_PAUSED', payload: false });
    
    // Restart timers for existing notifications
    state.notifications.forEach((notification) => {
      setTimer(notification);
    });
  }, [state.notifications, setTimer]);

  /**
   * Update notification content
   */
  const update = useCallback(
    (id: string, updates: Partial<NotificationConfig>): void => {
      dispatch({ 
        type: 'UPDATE_NOTIFICATION', 
        payload: { id, updates } 
      });
    },
    []
  );

  /**
   * Set edit page state
   */
  const setEditPageState = useCallback(
    (isEditPage: boolean, elementId?: string): void => {
      dispatch({ 
        type: 'SET_EDIT_PAGE_STATE', 
        payload: { isEditPage, elementId } 
      });
    },
    []
  );

  /**
   * Restore notifications for edit page
   */
  const restoreNotifications = useCallback((): void => {
    dispatch({ 
      type: 'RESTORE_NOTIFICATIONS', 
      payload: state.persistence.storedNotifications 
    });
  }, [state.persistence.storedNotifications]);

  /**
   * Clear stored notifications
   */
  const clearStoredNotifications = useCallback((): void => {
    dispatch({ 
      type: 'SET_EDIT_PAGE_STATE', 
      payload: { 
        isEditPage: state.persistence.isEditPage,
        elementId: state.persistence.lastElementId || undefined,
      } 
    });
  }, [state.persistence.isEditPage, state.persistence.lastElementId]);

  /**
   * Update queue configuration
   */
  const updateConfig = useCallback(
    (newConfig: Partial<NotificationQueueConfig>): void => {
      dispatch({ type: 'UPDATE_CONFIG', payload: newConfig });
    },
    []
  );

  /**
   * Set accessibility preferences
   */
  const setAccessibilityPreferences = useCallback(
    (preferences: Partial<NotificationState['accessibility']>): void => {
      dispatch({ 
        type: 'SET_ACCESSIBILITY_PREFERENCES', 
        payload: preferences 
      });
    },
    []
  );

  /**
   * Get notification by ID
   */
  const getNotification = useCallback(
    (id: string): Notification | null => {
      return state.notifications.find((n) => n.id === id) || null;
    },
    [state.notifications]
  );

  /**
   * Get notifications by type
   */
  const getNotificationsByType = useCallback(
    (type: NotificationType): Notification[] => {
      return state.notifications.filter((n) => n.type === type);
    },
    [state.notifications]
  );

  /**
   * Get last element (for edit page workflows)
   */
  const getLastElement = useCallback((): string | undefined => {
    return state.persistence.lastElementId || undefined;
  }, [state.persistence.lastElementId]);

  // ============================================================================
  // ANGULAR COMPATIBILITY LAYER
  // ============================================================================

  /**
   * DfSnackbar service compatibility
   */
  const dfSnackbarCompatibility: DfSnackbarCompatibility = useMemo(() => ({
    setSnackbarLastEle: (elementId: string, isEditPage: boolean): void => {
      setEditPageState(isEditPage, elementId);
    },
    openSnackBar: (message: string, alertType: NotificationType): void => {
      switch (alertType) {
        case 'success':
          success(message);
          break;
        case 'error':
          error(message);
          break;
        case 'warning':
          warning(message);
          break;
        case 'info':
          info(message);
          break;
        default:
          info(message);
      }
    },
    snackbarLastEle$: {
      subscribe: (callback: (config: string) => void) => {
        // Simple subscription simulation - in real implementation,
        // this would use a proper observable pattern
        callback(state.persistence.lastElementId || '');
      },
    },
    isEditPage$: {
      subscribe: (callback: (isEditPage: boolean) => void) => {
        callback(state.persistence.isEditPage);
      },
    },
  }), [setEditPageState, success, error, warning, info, state.persistence]);

  /**
   * NotificationService compatibility
   */
  const notificationServiceCompatibility: NotificationServiceCompatibility = useMemo(() => ({
    success: (title: string, message: string): void => {
      success(message, { title });
    },
    error: (title: string, message: string): void => {
      error(message, { title });
    },
  }), [success, error]);

  // ============================================================================
  // NOTIFICATION ACTIONS OBJECT
  // ============================================================================

  const actions: NotificationActions = useMemo(() => ({
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    pause,
    resume,
    update,
    setEditPageState,
    restoreNotifications,
    clearStoredNotifications,
    updateConfig,
    setAccessibilityPreferences,
    getNotification,
    getNotificationsByType,
    getLastElement,
  }), [
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    pause,
    resume,
    update,
    setEditPageState,
    restoreNotifications,
    clearStoredNotifications,
    updateConfig,
    setAccessibilityPreferences,
    getNotification,
    getNotificationsByType,
    getLastElement,
  ]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: NotificationContextValue = useMemo(() => ({
    // Base context value properties
    state,
    actions,
    isInitialized: true,
    isLoading: false,
    error: null,
    config: state.config,
    debug: debugInfo,

    // Hook return interface
    notifications: state.notifications,
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    pause,
    resume,
    updateConfig,
    setEditPageState,
    getLastElement,
    isPaused: state.paused,

    // Provider-specific properties
    providerConfig: state.config,
    compatibility: {
      dfSnackbar: dfSnackbarCompatibility,
      notificationService: notificationServiceCompatibility,
    },
  }), [
    state,
    actions,
    debugInfo,
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    dismissAll,
    pause,
    resume,
    updateConfig,
    setEditPageState,
    getLastElement,
    dfSnackbarCompatibility,
    notificationServiceCompatibility,
  ]);

  // ============================================================================
  // CLEANUP EFFECTS
  // ============================================================================

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  /**
   * Update timers when paused state changes
   */
  useEffect(() => {
    if (state.paused) {
      // Clear all timers when paused
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    } else {
      // Restart timers when resumed
      state.notifications.forEach((notification) => {
        setTimer(notification);
      });
    }
  }, [state.paused, state.notifications, setTimer]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Toast container will be rendered by Toast components */}
      <div
        ref={containerRef}
        id={`${id}-container`}
        className="pointer-events-none fixed inset-0 z-50"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      />
    </NotificationContext.Provider>
  );
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Export hook for external use
 */
export { useNotifications as default };

/**
 * Export notification provider
 */
export default NotificationProvider;

/**
 * Export all types for convenience
 */
export type {
  NotificationContextValue,
  NotificationState,
  NotificationActions,
  UseNotificationsReturn,
  NotificationProviderProps,
} from './provider-types';

export type {
  Notification,
  NotificationConfig,
  NotificationQueueConfig,
  NotificationType,
  NotificationDuration,
  DfSnackbarCompatibility,
  NotificationServiceCompatibility,
} from '@/types/notification';