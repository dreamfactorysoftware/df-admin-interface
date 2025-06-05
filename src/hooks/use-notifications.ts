/**
 * Notification Management Hook for React 19
 * 
 * Comprehensive notification and snackbar management hook that replaces Angular
 * DfSnackbarService and NotificationService with React state management. Provides
 * toast notifications, alert states, notification persistence, and accessibility
 * compliance for consistent notification workflows across the DreamFactory Admin Interface.
 * 
 * Features:
 * - Toast notification management with queue support and automatic dismissal timers
 * - Notification type variants with consistent styling and accessibility features
 * - Notification state persistence for edit page workflows and form submissions
 * - Integration with Tailwind CSS for notification styling and positioning
 * - Notification history tracking with last element state management
 * - WCAG 2.1 AA accessibility compliance with proper ARIA labels and keyboard navigation
 * - React 19 concurrent features support with optimistic updates
 * - TypeScript 5.8+ enhanced type safety and inference
 * 
 * @fileoverview Notification management hook for React application
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 5.4 - CROSS-CUTTING CONCERNS
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type {
  Notification,
  NotificationConfig,
  NotificationQueueConfig,
  NotificationQueueState,
  NotificationType,
  NotificationDuration,
  UseNotificationsReturn,
  NotificationAction,
  NotificationEventHandlers,
  DfSnackbarCompatibility,
  NotificationServiceCompatibility,
  DURATION_PRESETS,
  DEFAULT_NOTIFICATION_CONFIG,
  ARIA_CONFIG_BY_TYPE,
} from '@/types/notification';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default notification configuration with DreamFactory Admin Interface defaults
 * Maintains compatibility with existing Angular Material snackbar positioning
 */
const DEFAULT_CONFIG: NotificationQueueConfig = {
  ...DEFAULT_NOTIFICATION_CONFIG,
  defaultPosition: 'bottom-left', // Matches Angular Material positioning
  defaultDuration: 'medium',       // 5000ms matches Angular snackbar
  maxNotifications: 3,             // Prevent notification overflow
  groupSimilar: true,              // Group similar notifications
  animationDuration: 300,          // Smooth transitions
  zIndex: 9999,                    // Ensure notifications appear above all content
} as const;

/**
 * Duration presets matching Angular Material snackbar behavior
 */
const DURATION_MAP: Record<Exclude<NotificationDuration, number>, number> = {
  short: 3000,
  medium: 5000,     // Matches Angular DfSnackbarService default
  long: 10000,
  persistent: -1,   // Never auto-dismiss
} as const;

/**
 * Notification ID generator using timestamp and random component
 * Ensures unique IDs for notification tracking and persistence
 */
const generateNotificationId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Local storage key for notification persistence
 * Maintains state across page reloads and navigation
 */
const STORAGE_KEY = 'df-admin-notifications';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get numeric duration from NotificationDuration
 * Converts duration presets to actual milliseconds
 */
const getDurationMs = (duration: NotificationDuration = 'medium'): number => {
  if (typeof duration === 'number') return duration;
  return DURATION_MAP[duration];
};

/**
 * Generate ARIA attributes for notification accessibility
 * Ensures proper screen reader announcements based on notification type
 */
const getAriaAttributes = (type: NotificationType) => {
  const config = ARIA_CONFIG_BY_TYPE[type];
  return {
    'aria-live': config['aria-live'],
    'aria-atomic': config['aria-atomic'] || true,
    role: config.role,
  };
};

/**
 * Check if notifications should be grouped
 * Groups notifications with same type and similar messages
 */
const shouldGroupNotifications = (existing: Notification, incoming: NotificationConfig): boolean => {
  return (
    existing.type === incoming.type &&
    existing.message === incoming.message &&
    existing.title === incoming.title
  );
};

/**
 * Persist notifications to localStorage for edit page workflows
 * Maintains notification state during form submissions and page navigation
 */
const persistNotifications = (notifications: Notification[], lastElementId?: string, isEditPage?: boolean): void => {
  try {
    const persistenceData = {
      notifications: notifications.filter(n => n.variant !== 'modal'), // Don't persist modal notifications
      lastElementId,
      isEditPage,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistenceData));
  } catch (error) {
    console.warn('Failed to persist notifications:', error);
  }
};

/**
 * Restore notifications from localStorage
 * Reconstructs notification state on page load for continuity
 */
const restoreNotifications = (): { notifications: Notification[]; lastElementId?: string; isEditPage?: boolean } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { notifications: [] };

    const data = JSON.parse(stored);
    const now = Date.now();
    
    // Filter out expired notifications (older than 1 hour)
    const validNotifications = data.notifications?.filter((n: Notification) => {
      const age = now - n.timestamp;
      return age < 3600000; // 1 hour
    }) || [];

    return {
      notifications: validNotifications,
      lastElementId: data.lastElementId,
      isEditPage: data.isEditPage,
    };
  } catch (error) {
    console.warn('Failed to restore notifications:', error);
    return { notifications: [] };
  }
};

// =============================================================================
// MAIN HOOK IMPLEMENTATION
// =============================================================================

/**
 * useNotifications Hook
 * 
 * Provides comprehensive notification management functionality replacing Angular
 * DfSnackbarService and NotificationService. Manages notification queue, automatic
 * dismissal, persistence, and accessibility features.
 * 
 * @param initialConfig - Optional initial configuration for notification queue
 * @param eventHandlers - Optional event handlers for notification lifecycle
 * @returns UseNotificationsReturn object with notification management functions
 */
export const useNotifications = (
  initialConfig?: Partial<NotificationQueueConfig>,
  eventHandlers?: NotificationEventHandlers
): UseNotificationsReturn => {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [config, setConfig] = useState<NotificationQueueConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  }));

  const [queueState, setQueueState] = useState<NotificationQueueState>(() => {
    const restored = restoreNotifications();
    return {
      notifications: restored.notifications,
      config,
      paused: false,
      lastElementId: restored.lastElementId,
      isEditPage: restored.isEditPage || false,
    };
  });

  // Track timers for auto-dismissal
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Track announcement queue for screen readers
  const announcementQueueRef = useRef<string[]>([]);

  // =========================================================================
  // TIMER MANAGEMENT
  // =========================================================================

  /**
   * Clear timer for specific notification
   */
  const clearTimer = useCallback((id: string): void => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Set auto-dismissal timer for notification
   */
  const setDismissalTimer = useCallback((notification: Notification): void => {
    const duration = getDurationMs(notification.duration);
    
    if (duration > 0) {
      const timer = setTimeout(() => {
        setQueueState(prevState => {
          const updatedNotifications = prevState.notifications.filter(n => n.id !== notification.id);
          persistNotifications(updatedNotifications, prevState.lastElementId, prevState.isEditPage);
          return {
            ...prevState,
            notifications: updatedNotifications,
          };
        });
        
        // Call expire event handler
        eventHandlers?.onExpire?.(notification);
        
        // Clean up timer reference
        timersRef.current.delete(notification.id);
      }, duration);
      
      timersRef.current.set(notification.id, timer);
    }
  }, [eventHandlers]);

  // =========================================================================
  // NOTIFICATION MANAGEMENT
  // =========================================================================

  /**
   * Add notification to queue
   * Handles queue limits, grouping, and automatic dismissal setup
   */
  const addNotification = useCallback((notificationConfig: NotificationConfig): string => {
    const id = notificationConfig.id || generateNotificationId();
    const timestamp = notificationConfig.timestamp || Date.now();
    
    const notification: Notification = {
      variant: 'toast',
      position: config.defaultPosition,
      duration: config.defaultDuration,
      dismissible: true,
      announce: true,
      ...notificationConfig,
      id,
      timestamp,
    };

    setQueueState(prevState => {
      let updatedNotifications = [...prevState.notifications];

      // Check for grouping similar notifications
      if (config.groupSimilar) {
        const existingIndex = updatedNotifications.findIndex(n => 
          shouldGroupNotifications(n, notificationConfig)
        );
        
        if (existingIndex !== -1) {
          // Update existing notification timestamp instead of adding duplicate
          updatedNotifications[existingIndex] = {
            ...updatedNotifications[existingIndex],
            timestamp,
          };
          
          // Reset timer for updated notification
          clearTimer(updatedNotifications[existingIndex].id);
          setDismissalTimer(updatedNotifications[existingIndex]);
          
          return {
            ...prevState,
            notifications: updatedNotifications,
          };
        }
      }

      // Add new notification
      updatedNotifications.push(notification);

      // Enforce max notifications limit
      if (config.maxNotifications && updatedNotifications.length > config.maxNotifications) {
        const removedNotifications = updatedNotifications.splice(0, updatedNotifications.length - config.maxNotifications);
        
        // Clear timers for removed notifications
        removedNotifications.forEach(n => clearTimer(n.id));
        
        // Call queue full handler
        eventHandlers?.onQueueFull?.(notification, updatedNotifications);
      }

      // Persist updated state
      persistNotifications(updatedNotifications, prevState.lastElementId, prevState.isEditPage);

      return {
        ...prevState,
        notifications: updatedNotifications,
      };
    });

    // Set auto-dismissal timer if not paused
    if (!queueState.paused) {
      setDismissalTimer(notification);
    }

    // Announce to screen readers
    if (notification.announce) {
      const announcement = notification.title 
        ? `${notification.title}: ${notification.message}`
        : notification.message;
      
      announcementQueueRef.current.push(announcement);
    }

    // Call show event handler
    eventHandlers?.onShow?.(notification);

    return id;
  }, [config, queueState.paused, clearTimer, setDismissalTimer, eventHandlers]);

  /**
   * Dismiss specific notification by ID
   */
  const dismiss = useCallback((id: string): void => {
    setQueueState(prevState => {
      const notification = prevState.notifications.find(n => n.id === id);
      const updatedNotifications = prevState.notifications.filter(n => n.id !== id);
      
      // Persist updated state
      persistNotifications(updatedNotifications, prevState.lastElementId, prevState.isEditPage);
      
      // Call dismiss event handler
      if (notification) {
        eventHandlers?.onDismiss?.(notification);
      }
      
      return {
        ...prevState,
        notifications: updatedNotifications,
      };
    });

    // Clear timer for dismissed notification
    clearTimer(id);
  }, [clearTimer, eventHandlers]);

  /**
   * Dismiss all notifications
   */
  const dismissAll = useCallback((): void => {
    setQueueState(prevState => {
      // Clear all timers
      prevState.notifications.forEach(n => clearTimer(n.id));
      
      // Persist cleared state
      persistNotifications([], prevState.lastElementId, prevState.isEditPage);
      
      // Call dismiss handlers for all notifications
      prevState.notifications.forEach(notification => {
        eventHandlers?.onDismiss?.(notification);
      });
      
      return {
        ...prevState,
        notifications: [],
      };
    });
  }, [clearTimer, eventHandlers]);

  // =========================================================================
  // PAUSE/RESUME FUNCTIONALITY
  // =========================================================================

  /**
   * Pause auto-dismissal timers (useful on hover)
   */
  const pause = useCallback((): void => {
    setQueueState(prevState => {
      if (prevState.paused) return prevState;
      
      // Clear all active timers
      queueState.notifications.forEach(n => clearTimer(n.id));
      
      return {
        ...prevState,
        paused: true,
      };
    });
  }, [queueState.notifications, clearTimer]);

  /**
   * Resume auto-dismissal timers
   */
  const resume = useCallback((): void => {
    setQueueState(prevState => {
      if (!prevState.paused) return prevState;
      
      // Restart timers for all notifications
      prevState.notifications.forEach(notification => {
        setDismissalTimer(notification);
      });
      
      return {
        ...prevState,
        paused: false,
      };
    });
  }, [setDismissalTimer]);

  // =========================================================================
  // CONFIGURATION MANAGEMENT
  // =========================================================================

  /**
   * Update notification queue configuration
   */
  const updateConfig = useCallback((newConfig: Partial<NotificationQueueConfig>): void => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig,
    }));

    setQueueState(prevState => ({
      ...prevState,
      config: {
        ...prevState.config,
        ...newConfig,
      },
    }));
  }, []);

  // =========================================================================
  // EDIT PAGE STATE MANAGEMENT
  // =========================================================================

  /**
   * Set edit page state for notification persistence
   * Maintains notification context during form workflows
   */
  const setEditPageState = useCallback((isEditPage: boolean, elementId?: string): void => {
    setQueueState(prevState => {
      const updatedState = {
        ...prevState,
        isEditPage,
        lastElementId: elementId || prevState.lastElementId,
      };
      
      // Persist edit page state
      persistNotifications(prevState.notifications, updatedState.lastElementId, updatedState.isEditPage);
      
      return updatedState;
    });
  }, []);

  /**
   * Get last notification element ID for edit page workflows
   */
  const getLastElement = useCallback((): string | undefined => {
    return queueState.lastElementId;
  }, [queueState.lastElementId]);

  // =========================================================================
  // CONVENIENCE NOTIFICATION METHODS
  // =========================================================================

  /**
   * Show success notification
   */
  const success = useCallback((message: string, options?: Partial<NotificationConfig>): string => {
    return addNotification({
      type: 'success',
      message,
      duration: 'medium',
      ...options,
    });
  }, [addNotification]);

  /**
   * Show error notification
   */
  const error = useCallback((message: string, options?: Partial<NotificationConfig>): string => {
    return addNotification({
      type: 'error',
      message,
      duration: 'long',
      announce: true, // Always announce errors
      ...options,
    });
  }, [addNotification]);

  /**
   * Show warning notification
   */
  const warning = useCallback((message: string, options?: Partial<NotificationConfig>): string => {
    return addNotification({
      type: 'warning',
      message,
      duration: 'long',
      ...options,
    });
  }, [addNotification]);

  /**
   * Show info notification
   */
  const info = useCallback((message: string, options?: Partial<NotificationConfig>): string => {
    return addNotification({
      type: 'info',
      message,
      duration: 'medium',
      ...options,
    });
  }, [addNotification]);

  // =========================================================================
  // CLEANUP EFFECTS
  // =========================================================================

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all timers on cleanup
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  /**
   * Handle visibility changes to pause/resume notifications
   * Improves accessibility and user experience
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pause, resume]);

  // =========================================================================
  // MEMOIZED RETURN VALUE
  // =========================================================================

  const returnValue = useMemo((): UseNotificationsReturn => ({
    notifications: queueState.notifications,
    notify: addNotification,
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
    isPaused: queueState.paused,
    config,
  }), [
    queueState.notifications,
    queueState.paused,
    addNotification,
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
    config,
  ]);

  return returnValue;
};

// =============================================================================
// MIGRATION COMPATIBILITY HELPERS
// =============================================================================

/**
 * Create Angular DfSnackbarService compatibility wrapper
 * Enables drop-in replacement during migration from Angular
 */
export const createDfSnackbarCompatibility = (
  notificationsHook: UseNotificationsReturn
): DfSnackbarCompatibility => {
  return {
    setSnackbarLastEle: (config: string, isEditPage: boolean) => {
      notificationsHook.setEditPageState(isEditPage, config);
    },
    
    openSnackBar: (message: string, alertType: NotificationType) => {
      notificationsHook.notify({
        type: alertType,
        message,
        position: 'bottom-left', // Match Angular Material positioning
        duration: 5000, // Match Angular snackbar duration
      });
    },
  };
};

/**
 * Create Angular NotificationService compatibility wrapper
 * Enables drop-in replacement during migration from Angular
 */
export const createNotificationServiceCompatibility = (
  notificationsHook: UseNotificationsReturn
): NotificationServiceCompatibility => {
  return {
    success: (title: string, message: string) => {
      notificationsHook.success(message, { title });
    },
    
    error: (title: string, message: string) => {
      notificationsHook.error(message, { title });
    },
  };
};

// =============================================================================
// CUSTOM HOOK VARIANTS
// =============================================================================

/**
 * useToastNotifications - Simplified hook for basic toast notifications
 * Provides a minimal API for simple notification needs
 */
export const useToastNotifications = () => {
  const notifications = useNotifications({
    maxNotifications: 3,
    defaultPosition: 'bottom-right',
    defaultDuration: 'medium',
  });

  return {
    success: notifications.success,
    error: notifications.error,
    warning: notifications.warning,
    info: notifications.info,
    dismiss: notifications.dismiss,
    dismissAll: notifications.dismissAll,
  };
};

/**
 * useFormNotifications - Specialized hook for form validation notifications
 * Optimized for form submission workflows and validation feedback
 */
export const useFormNotifications = () => {
  const notifications = useNotifications({
    maxNotifications: 5,
    defaultPosition: 'top-center',
    defaultDuration: 'long',
    groupSimilar: true,
  });

  const showValidationError = useCallback((field: string, message: string) => {
    return notifications.error(message, {
      title: `${field} Validation Error`,
      announce: true,
      metadata: { field, type: 'validation' },
    });
  }, [notifications]);

  const showFormSuccess = useCallback((message: string = 'Form submitted successfully') => {
    return notifications.success(message, {
      duration: 'short',
      announce: true,
    });
  }, [notifications]);

  const clearValidationErrors = useCallback(() => {
    // Clear only validation error notifications
    notifications.notifications
      .filter(n => n.type === 'error' && n.metadata?.type === 'validation')
      .forEach(n => notifications.dismiss(n.id));
  }, [notifications]);

  return {
    ...notifications,
    showValidationError,
    showFormSuccess,
    clearValidationErrors,
  };
};

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

export default useNotifications;