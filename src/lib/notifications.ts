/**
 * Notification utility for the DreamFactory Admin Interface
 * 
 * Provides a centralized system for displaying user notifications including
 * success messages, error alerts, warnings, and informational notices.
 * Integrates with React toast systems and follows accessibility best practices.
 * 
 * Features:
 * - Type-safe notification interface
 * - Consistent styling and behavior
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Action support for interactive notifications
 * - Duration control and auto-dismiss
 * - Queue management for multiple notifications
 */

/**
 * Notification types aligned with UI design system
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification action interface for interactive notifications
 */
export interface NotificationAction {
  /** Action button label */
  label: string;
  
  /** Action callback function */
  onClick: () => void;
  
  /** Action button variant */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /** Whether the action should close the notification */
  dismissOnClick?: boolean;
}

/**
 * Notification configuration interface
 */
export interface NotificationConfig {
  /** Notification type determines styling and icon */
  type: NotificationType;
  
  /** Primary notification title */
  title: string;
  
  /** Detailed notification message */
  message: string;
  
  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;
  
  /** Optional action button */
  action?: NotificationAction;
  
  /** Unique identifier for the notification */
  id?: string;
  
  /** Whether the notification can be manually dismissed */
  dismissible?: boolean;
  
  /** Additional CSS classes for customization */
  className?: string;
  
  /** Position on screen */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * Internal notification state interface
 */
interface NotificationState extends NotificationConfig {
  /** Unique identifier (required internally) */
  id: string;
  
  /** Creation timestamp */
  createdAt: number;
  
  /** Whether the notification is currently visible */
  visible: boolean;
}

/**
 * Notification manager class for handling notification lifecycle
 */
class NotificationManager {
  private notifications: Map<string, NotificationState> = new Map();
  private subscribers: Set<(notifications: NotificationState[]) => void> = new Set();
  private nextId = 1;

  /**
   * Add a new notification to the queue
   */
  add(config: NotificationConfig): string {
    const id = config.id || `notification-${this.nextId++}`;
    const notification: NotificationState = {
      ...config,
      id,
      createdAt: Date.now(),
      visible: true,
      duration: config.duration ?? this.getDefaultDuration(config.type),
      dismissible: config.dismissible ?? true,
      position: config.position ?? 'top-right',
    };

    this.notifications.set(id, notification);
    this.notifySubscribers();

    // Set auto-dismiss timer if duration is specified
    if (notification.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * Remove a notification by ID
   */
  remove(id: string): boolean {
    const removed = this.notifications.delete(id);
    if (removed) {
      this.notifySubscribers();
    }
    return removed;
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications.clear();
    this.notifySubscribers();
  }

  /**
   * Get all current notifications
   */
  getAll(): NotificationState[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(callback: (notifications: NotificationState[]) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of notification changes
   */
  private notifySubscribers(): void {
    const notifications = this.getAll();
    this.subscribers.forEach(callback => {
      try {
        callback(notifications);
      } catch (error) {
        console.error('Error in notification subscriber:', error);
      }
    });
  }

  /**
   * Get default duration based on notification type
   */
  private getDefaultDuration(type: NotificationType): number {
    switch (type) {
      case 'success':
        return 4000; // 4 seconds
      case 'info':
        return 6000; // 6 seconds
      case 'warning':
        return 8000; // 8 seconds
      case 'error':
        return 0; // No auto-dismiss for errors
      default:
        return 5000; // 5 seconds default
    }
  }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

/**
 * Show a notification with the specified configuration
 * 
 * @param config - Notification configuration
 * @returns Notification ID for programmatic control
 */
export function showNotification(config: NotificationConfig): string {
  return notificationManager.add(config);
}

/**
 * Show a success notification
 * 
 * @param title - Notification title
 * @param message - Notification message
 * @param options - Additional configuration options
 * @returns Notification ID
 */
export function showSuccess(
  title: string, 
  message: string, 
  options: Partial<NotificationConfig> = {}
): string {
  return showNotification({
    type: 'success',
    title,
    message,
    ...options,
  });
}

/**
 * Show an error notification
 * 
 * @param title - Notification title
 * @param message - Notification message
 * @param options - Additional configuration options
 * @returns Notification ID
 */
export function showError(
  title: string, 
  message: string, 
  options: Partial<NotificationConfig> = {}
): string {
  return showNotification({
    type: 'error',
    title,
    message,
    duration: 0, // Errors don't auto-dismiss by default
    ...options,
  });
}

/**
 * Show a warning notification
 * 
 * @param title - Notification title
 * @param message - Notification message
 * @param options - Additional configuration options
 * @returns Notification ID
 */
export function showWarning(
  title: string, 
  message: string, 
  options: Partial<NotificationConfig> = {}
): string {
  return showNotification({
    type: 'warning',
    title,
    message,
    ...options,
  });
}

/**
 * Show an info notification
 * 
 * @param title - Notification title
 * @param message - Notification message
 * @param options - Additional configuration options
 * @returns Notification ID
 */
export function showInfo(
  title: string, 
  message: string, 
  options: Partial<NotificationConfig> = {}
): string {
  return showNotification({
    type: 'info',
    title,
    message,
    ...options,
  });
}

/**
 * Remove a specific notification by ID
 * 
 * @param id - Notification ID to remove
 * @returns Whether the notification was found and removed
 */
export function dismissNotification(id: string): boolean {
  return notificationManager.remove(id);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  notificationManager.clear();
}

/**
 * Subscribe to notification changes for UI integration
 * 
 * @param callback - Function to call when notifications change
 * @returns Unsubscribe function
 */
export function subscribeToNotifications(
  callback: (notifications: NotificationState[]) => void
): () => void {
  return notificationManager.subscribe(callback);
}

/**
 * Get all current notifications
 * 
 * @returns Array of current notifications
 */
export function getCurrentNotifications(): NotificationState[] {
  return notificationManager.getAll();
}

/**
 * React hook for using notifications in components
 * This would typically be implemented in a separate hooks file
 */
export interface UseNotificationsReturn {
  notifications: NotificationState[];
  showNotification: typeof showNotification;
  showSuccess: typeof showSuccess;
  showError: typeof showError;
  showWarning: typeof showWarning;
  showInfo: typeof showInfo;
  dismissNotification: typeof dismissNotification;
  clearAll: typeof clearAllNotifications;
}

/**
 * Export the notification manager for advanced use cases
 */
export { notificationManager };

/**
 * Export types for external use
 */
export type {
  NotificationConfig,
  NotificationAction,
  NotificationState,
  UseNotificationsReturn,
};