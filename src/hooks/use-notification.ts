/**
 * Notification Hook (Simplified Version)
 * 
 * Simplified notification hook for components that need basic notification functionality.
 * This is a lightweight wrapper around the full useNotifications hook specifically for
 * CRUD operations and simple user feedback scenarios.
 * 
 * @author DreamFactory Admin Interface Team
 * @version React 19/Next.js 15.1 Migration
 */

import { useNotifications } from './use-notifications';

/**
 * Simplified notification interface for basic CRUD operations
 */
export interface NotificationOptions {
  message: string;
  title?: string;
  duration?: number;
  dismissible?: boolean;
}

/**
 * Return type for simplified notification hook
 */
export interface UseNotificationReturn {
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', options: NotificationOptions) => string;
}

/**
 * Simplified notification hook that provides basic notification functionality
 * for CRUD operations and user feedback. This hook is designed for components
 * that need simple notification capabilities without the full notification
 * management features.
 * 
 * Features:
 * - Simple success, error, warning, and info notifications
 * - Automatic message formatting for CRUD operations
 * - Integration with the main notification system
 * - Optimized for form submissions and API operations
 * 
 * @example
 * ```tsx
 * const notification = useNotification();
 * 
 * // Simple success message
 * notification.success('Email template saved successfully');
 * 
 * // Error with title
 * notification.error('Failed to save template', 'Validation Error');
 * 
 * // Custom notification
 * notification.showNotification('info', {
 *   message: 'Template is being processed',
 *   duration: 3000
 * });
 * ```
 */
export function useNotification(): UseNotificationReturn {
  const { success, error, warning, info, showNotification } = useNotifications();

  /**
   * Show a notification with specified type and options
   */
  const notify = (type: 'success' | 'error' | 'warning' | 'info', options: NotificationOptions): string => {
    return showNotification({
      type,
      message: options.message,
      title: options.title,
      duration: options.duration,
      dismissible: options.dismissible
    });
  };

  return {
    success,
    error,
    warning,
    info,
    showNotification: notify
  };
}

/**
 * Export types for external use
 */
export type { NotificationOptions };