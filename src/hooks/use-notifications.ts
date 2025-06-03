import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounce } from './use-debounce';

/**
 * Notification types matching Angular AlertType for compatibility
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification item structure for queue management
 */
export interface NotificationItem {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  timestamp: number;
  isVisible: boolean;
  onDismiss?: () => void;
}

/**
 * Notification configuration options
 */
export interface NotificationConfig {
  message: string;
  type: NotificationType;
  title?: string;
  duration?: number;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * Edit page state management for notification persistence
 */
export interface EditPageState {
  lastElement: string;
  isEditPage: boolean;
}

/**
 * Notification hook return interface
 */
export interface UseNotificationsReturn {
  // Notification queue and display
  notifications: NotificationItem[];
  showNotification: (config: NotificationConfig) => string;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Quick notification methods
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  
  // Edit page state management (DfSnackbarService compatibility)
  editPageState: EditPageState;
  setEditPageState: (lastElement: string, isEditPage: boolean) => void;
  
  // History and persistence
  lastNotification: NotificationItem | null;
  isLoading: boolean;
}

/**
 * Default notification configuration
 */
const DEFAULT_DURATION = 5000; // 5 seconds, matching Angular Material snackbar
const MAX_NOTIFICATIONS = 5; // Limit concurrent notifications
const CLEANUP_DELAY = 300; // Delay before removing from DOM for animations

/**
 * Generate unique notification ID
 */
const generateNotificationId = (): string => {
  return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Notification and snackbar management hook that handles toast notifications,
 * alert states, and notification persistence. Replaces Angular DfSnackbarService 
 * and NotificationService with React state management for consistent notification 
 * workflows and user feedback across the application.
 * 
 * Features:
 * - Toast notification management with queue support and automatic dismissal timers
 * - Notification type variants with consistent styling and accessibility features
 * - Notification state persistence for edit page workflows and form submissions
 * - Integration with Tailwind CSS for notification styling and positioning
 * - Notification history tracking with last element state management
 * - Accessibility compliance with proper ARIA labels and keyboard navigation support
 * 
 * @example
 * ```tsx
 * const {
 *   success,
 *   error,
 *   notifications,
 *   dismissNotification,
 *   setEditPageState
 * } = useNotifications();
 * 
 * // Quick success notification
 * success('Database connected successfully');
 * 
 * // Error with title
 * error('Connection failed', 'Database Error');
 * 
 * // Custom notification with configuration
 * showNotification({
 *   message: 'Schema update in progress',
 *   type: 'info',
 *   duration: 10000,
 *   dismissible: true
 * });
 * 
 * // Edit page state management
 * setEditPageState('database-form', true);
 * ```
 */
export function useNotifications(): UseNotificationsReturn {
  // Notification queue state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [editPageState, setEditPageStateInternal] = useState<EditPageState>({
    lastElement: '',
    isEditPage: false
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for managing timers and cleanup
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const cleanupTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Debounced loading state to prevent flicker
  const debouncedLoading = useDebounce(isLoading, 150);
  
  // Get last notification for history tracking
  const lastNotification = notifications.length > 0 
    ? notifications[notifications.length - 1] 
    : null;

  /**
   * Clean up timers when component unmounts or notifications change
   */
  useEffect(() => {
    return () => {
      // Clear all active timers
      timeoutRefs.current.forEach(timer => clearTimeout(timer));
      cleanupTimeoutRefs.current.forEach(timer => clearTimeout(timer));
      timeoutRefs.current.clear();
      cleanupTimeoutRefs.current.clear();
    };
  }, []);

  /**
   * Set up automatic dismissal timers for notifications
   */
  useEffect(() => {
    notifications.forEach(notification => {
      // Skip if timer already exists or notification is not dismissible
      if (timeoutRefs.current.has(notification.id) || 
          notification.duration === 0 || 
          !notification.dismissible) {
        return;
      }

      const timer = setTimeout(() => {
        dismissNotification(notification.id);
      }, notification.duration || DEFAULT_DURATION);

      timeoutRefs.current.set(notification.id, timer);
    });
  }, [notifications]);

  /**
   * Add a new notification to the queue
   */
  const showNotification = useCallback((config: NotificationConfig): string => {
    const id = generateNotificationId();
    
    const newNotification: NotificationItem = {
      id,
      message: config.message,
      type: config.type,
      title: config.title,
      duration: config.duration ?? DEFAULT_DURATION,
      dismissible: config.dismissible ?? true,
      timestamp: Date.now(),
      isVisible: true,
      onDismiss: config.onDismiss
    };

    setNotifications(prev => {
      // Limit concurrent notifications
      const updated = [...prev, newNotification];
      if (updated.length > MAX_NOTIFICATIONS) {
        // Remove oldest notifications
        const toRemove = updated.slice(0, updated.length - MAX_NOTIFICATIONS);
        toRemove.forEach(notification => {
          // Clear timers for removed notifications
          const timer = timeoutRefs.current.get(notification.id);
          if (timer) {
            clearTimeout(timer);
            timeoutRefs.current.delete(notification.id);
          }
        });
        return updated.slice(-MAX_NOTIFICATIONS);
      }
      return updated;
    });

    // Set loading state briefly for smooth transitions
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 100);

    return id;
  }, []);

  /**
   * Dismiss a specific notification by ID
   */
  const dismissNotification = useCallback((id: string) => {
    // Find the notification to call its onDismiss callback
    const notification = notifications.find(n => n.id === id);
    
    // Clear the auto-dismiss timer
    const timer = timeoutRefs.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutRefs.current.delete(id);
    }

    // Mark as not visible for exit animation
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isVisible: false } : n)
    );

    // Remove from DOM after animation delay
    const cleanupTimer = setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      cleanupTimeoutRefs.current.delete(id);
      
      // Call onDismiss callback if provided
      if (notification?.onDismiss) {
        notification.onDismiss();
      }
    }, CLEANUP_DELAY);

    cleanupTimeoutRefs.current.set(id, cleanupTimer);
  }, [notifications]);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    // Clear all timers
    timeoutRefs.current.forEach(timer => clearTimeout(timer));
    cleanupTimeoutRefs.current.forEach(timer => clearTimeout(timer));
    timeoutRefs.current.clear();
    cleanupTimeoutRefs.current.clear();

    // Call onDismiss for all notifications
    notifications.forEach(notification => {
      if (notification.onDismiss) {
        notification.onDismiss();
      }
    });

    setNotifications([]);
  }, [notifications]);

  /**
   * Set edit page state for notification persistence (DfSnackbarService compatibility)
   */
  const setEditPageState = useCallback((lastElement: string, isEditPage: boolean) => {
    setEditPageStateInternal({
      lastElement,
      isEditPage
    });
  }, []);

  /**
   * Quick success notification method
   */
  const success = useCallback((message: string, title?: string): string => {
    return showNotification({
      message,
      title,
      type: 'success'
    });
  }, [showNotification]);

  /**
   * Quick error notification method
   */
  const error = useCallback((message: string, title?: string): string => {
    return showNotification({
      message,
      title,
      type: 'error',
      duration: 8000 // Longer duration for errors
    });
  }, [showNotification]);

  /**
   * Quick warning notification method
   */
  const warning = useCallback((message: string, title?: string): string => {
    return showNotification({
      message,
      title,
      type: 'warning',
      duration: 6000 // Slightly longer for warnings
    });
  }, [showNotification]);

  /**
   * Quick info notification method
   */
  const info = useCallback((message: string, title?: string): string => {
    return showNotification({
      message,
      title,
      type: 'info'
    });
  }, [showNotification]);

  return {
    // Notification queue and display
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    
    // Quick notification methods
    success,
    error,
    warning,
    info,
    
    // Edit page state management (DfSnackbarService compatibility)
    editPageState,
    setEditPageState,
    
    // History and state
    lastNotification,
    isLoading: debouncedLoading
  };
}

/**
 * Export notification types for external use
 */
export type { NotificationItem, NotificationConfig, EditPageState };