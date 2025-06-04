/**
 * NotificationProvider - React Context Provider for Toast Notifications
 * 
 * Replaces Angular Material mat-snackbar with React-based notification system using Headless UI
 * components and Tailwind CSS styling. Provides comprehensive notification queue management,
 * auto-dismissal timing, and persistence across route changes for critical user feedback.
 * 
 * Key Features:
 * - Headless UI 2.0+ integration for WCAG 2.1 AA compliance
 * - Tailwind CSS 4.1+ utility classes for responsive design and animations
 * - React Context API for notification state management with queue handling
 * - Auto-dismissal timing with configurable duration for different notification types
 * - Notification persistence across route changes for critical user feedback messages
 * - Queue management with maximum visible notifications and auto-cleanup
 * - Convenience methods for success, error, warning, info, and loading notifications
 * - Sound notification support with customizable audio files
 * - Position management for optimal user experience
 * 
 * @version 1.0.0
 * @requires React 19.0.0 for enhanced concurrent features and context optimizations
 * @requires Headless UI 2.0+ for accessible notification components
 * @requires Tailwind CSS 4.1+ for utility-first styling with animation support
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useCallback, 
  useReducer, 
  useEffect, 
  useRef,
  useMemo 
} from 'react';
import { useRouter } from 'next/navigation';
import { Transition, TransitionChild } from '@headlessui/react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  NotificationState,
  NotificationActions,
  NotificationContextValue,
  NotificationProviderProps,
  Notification,
  NotificationType,
  NotificationPosition,
  NotificationSettings,
  NotificationAction
} from './provider-types';

// =============================================================================
// Constants and Configuration
// =============================================================================

/**
 * Default notification settings optimized for DreamFactory Admin Interface
 */
const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  defaultDuration: 5000, // 5 seconds for most notifications
  maxVisible: 5, // Maximum 5 notifications visible at once
  defaultPosition: 'top-right',
  animationDuration: 300, // 300ms for smooth transitions
  enableSound: false, // Disabled by default for professional environment
  sounds: {
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3',
    warning: '/sounds/warning.mp3',
    info: '/sounds/info.mp3',
  },
};

/**
 * Duration settings by notification type for optimal user experience
 */
const TYPE_DURATIONS: Record<NotificationType, number> = {
  success: 4000, // 4 seconds - quick acknowledgment
  error: 8000, // 8 seconds - important to read error details
  warning: 6000, // 6 seconds - warning requires attention
  info: 5000, // 5 seconds - standard information
  loading: 0, // No auto-dismiss for loading states
};

/**
 * Icon mapping for each notification type using Heroicons
 */
const TYPE_ICONS = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
  loading: ArrowPathIcon,
} as const;

/**
 * Tailwind CSS classes for notification styling based on type
 */
const TYPE_STYLES = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    icon: 'text-green-400 dark:text-green-300',
    title: 'text-green-800 dark:text-green-200',
    message: 'text-green-700 dark:text-green-300',
    closeButton: 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    icon: 'text-red-400 dark:text-red-300',
    title: 'text-red-800 dark:text-red-200',
    message: 'text-red-700 dark:text-red-300',
    closeButton: 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-400 dark:text-yellow-300',
    title: 'text-yellow-800 dark:text-yellow-200',
    message: 'text-yellow-700 dark:text-yellow-300',
    closeButton: 'text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    icon: 'text-blue-400 dark:text-blue-300',
    title: 'text-blue-800 dark:text-blue-200',
    message: 'text-blue-700 dark:text-blue-300',
    closeButton: 'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300',
  },
  loading: {
    container: 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-900/20 dark:border-gray-800 dark:text-gray-200',
    icon: 'text-gray-400 dark:text-gray-300 animate-spin',
    title: 'text-gray-800 dark:text-gray-200',
    message: 'text-gray-700 dark:text-gray-300',
    closeButton: 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300',
  },
} as const;

/**
 * Position-based Tailwind CSS classes for notification container placement
 */
const POSITION_STYLES: Record<NotificationPosition, string> = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

// =============================================================================
// State Management - Reducer Pattern for Complex State Logic
// =============================================================================

/**
 * Action types for notification state management
 */
type NotificationActionType = 
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'CLEAR_BY_TYPE'; payload: NotificationType }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'SET_PERSIST_ACROSS_ROUTES'; payload: boolean };

/**
 * Notification state reducer with comprehensive action handling
 * Implements queue management, auto-cleanup, and state optimization
 */
function notificationReducer(
  state: NotificationState, 
  action: NotificationActionType
): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification = action.payload;
      const updatedNotifications = [...state.notifications, newNotification];
      
      // Enforce maximum queue size by removing oldest notifications
      const trimmedNotifications = updatedNotifications.length > state.maxQueueSize
        ? updatedNotifications.slice(-state.maxQueueSize)
        : updatedNotifications;
      
      return {
        ...state,
        notifications: trimmedNotifications,
      };
    }
    
    case 'REMOVE_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    }
    
    case 'CLEAR_ALL': {
      return {
        ...state,
        notifications: [],
      };
    }
    
    case 'CLEAR_BY_TYPE': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.type !== action.payload),
      };
    }
    
    case 'MARK_AS_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, isRead: true } : n
        ),
      };
    }
    
    case 'MARK_ALL_AS_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      };
    }
    
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        globalSettings: { ...state.globalSettings, ...action.payload },
      };
    }
    
    case 'SET_PERSIST_ACROSS_ROUTES': {
      return {
        ...state,
        persistAcrossRoutes: action.payload,
      };
    }
    
    default:
      return state;
  }
}

// =============================================================================
// Context Definition and Hook
// =============================================================================

/**
 * Notification context with comprehensive type safety
 */
const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Custom hook for accessing notification context with error handling
 * @returns NotificationContextValue with all notification state and actions
 * @throws Error if used outside of NotificationProvider
 */
export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider. ' +
      'Please wrap your component tree with <NotificationProvider>.'
    );
  }
  
  return context;
}

// =============================================================================
// Individual Notification Component
// =============================================================================

/**
 * Individual notification component with Headless UI transitions and accessibility
 */
interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onActionClick: (actionId: string, handler: () => void | Promise<void>) => void;
  settings: NotificationSettings;
}

function NotificationItem({
  notification,
  onDismiss,
  onMarkAsRead,
  onActionClick,
  settings,
}: NotificationItemProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const Icon = TYPE_ICONS[notification.type];
  const styles = TYPE_STYLES[notification.type];
  
  // Auto-dismiss logic with configurable timing
  useEffect(() => {
    setIsVisible(true);
    
    const duration = notification.duration ?? TYPE_DURATIONS[notification.type];
    
    if (duration > 0 && !notification.persistent) {
      timeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notification.id, notification.duration, notification.persistent]);
  
  // Handle dismiss with animation
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    
    // Delay actual removal to allow exit animation
    setTimeout(() => {
      onDismiss(notification.id);
    }, settings.animationDuration);
  }, [notification.id, onDismiss, settings.animationDuration]);
  
  // Handle action button clicks
  const handleActionClick = useCallback(async (action: NotificationAction) => {
    try {
      await action.handler();
      onActionClick(action.id, action.handler);
      
      // Auto-dismiss after successful action unless persistent
      if (!notification.persistent) {
        handleDismiss();
      }
    } catch (error) {
      console.error('Notification action failed:', error);
    }
  }, [notification.persistent, handleDismiss, onActionClick]);
  
  // Mark as read when notification becomes visible
  useEffect(() => {
    if (isVisible && !notification.isRead) {
      onMarkAsRead(notification.id);
    }
  }, [isVisible, notification.isRead, notification.id, onMarkAsRead]);
  
  return (
    <Transition
      show={isVisible && !isExiting}
      as="div"
      className={`
        max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto 
        ring-1 ring-black ring-opacity-5 overflow-hidden border
        ${styles.container}
      `}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon 
              className={`h-6 w-6 ${styles.icon}`} 
              aria-hidden="true"
            />
          </div>
          
          {/* Content */}
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${styles.title}`}>
              {notification.title}
            </p>
            {notification.message && (
              <p className={`mt-1 text-sm ${styles.message}`}>
                {notification.message}
              </p>
            )}
            
            {/* Action buttons */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleActionClick(action)}
                    className={`
                      inline-flex items-center px-3 py-2 border border-transparent text-sm 
                      leading-4 font-medium rounded-md focus:outline-none focus:ring-2 
                      focus:ring-offset-2 transition-colors duration-200
                      ${action.variant === 'primary' 
                        ? 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500'
                        : action.variant === 'secondary'
                        ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                        : 'text-gray-700 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200'
                      }
                    `}
                  >
                    {action.icon && (
                      <span className="mr-2" aria-hidden="true">
                        {action.icon}
                      </span>
                    )}
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Close button */}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className={`
                rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-primary-500 transition-colors duration-200
                ${styles.closeButton}
              `}
              onClick={handleDismiss}
              aria-label={`Dismiss ${notification.type} notification: ${notification.title}`}
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  );
}

// =============================================================================
// Notification Container Component
// =============================================================================

/**
 * Container component for rendering all notifications with proper positioning
 */
interface NotificationContainerProps {
  notifications: Notification[];
  position: NotificationPosition;
  onDismiss: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onActionClick: (actionId: string, handler: () => void | Promise<void>) => void;
  settings: NotificationSettings;
}

function NotificationContainer({
  notifications,
  position,
  onDismiss,
  onMarkAsRead,
  onActionClick,
  settings,
}: NotificationContainerProps) {
  // Filter to show only the maximum allowed visible notifications
  const visibleNotifications = notifications.slice(-settings.maxVisible);
  
  if (visibleNotifications.length === 0) {
    return null;
  }
  
  return (
    <div
      className={`
        fixed z-50 flex flex-col space-y-4 pointer-events-none
        ${POSITION_STYLES[position]}
      `}
      aria-live="polite"
      aria-label="Notifications"
    >
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          onMarkAsRead={onMarkAsRead}
          onActionClick={onActionClick}
          settings={settings}
        />
      ))}
    </div>
  );
}

// =============================================================================
// Main Provider Component
// =============================================================================

/**
 * NotificationProvider - Main provider component with comprehensive notification management
 * 
 * Features:
 * - React 19 optimized context with concurrent features
 * - Queue management with configurable limits
 * - Auto-dismissal with type-specific timing
 * - Persistence across route changes
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Sound notification support
 * - Responsive positioning
 * - Error handling and recovery
 */
export function NotificationProvider({
  children,
  maxQueueSize = 10,
  position = 'top-right',
  persistAcrossRoutes = true,
  settings: customSettings,
  ...props
}: NotificationProviderProps) {
  // Initialize state with reducer pattern for complex state management
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    maxQueueSize,
    globalSettings: { ...DEFAULT_NOTIFICATION_SETTINGS, ...customSettings },
    persistAcrossRoutes,
  });
  
  const router = useRouter();
  const audioRef = useRef<{ [key in NotificationType]?: HTMLAudioElement }>({});
  const idCounterRef = useRef(0);
  
  // Initialize audio elements for sound notifications
  useEffect(() => {
    if (state.globalSettings.enableSound) {
      Object.entries(state.globalSettings.sounds).forEach(([type, url]) => {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioRef.current[type as NotificationType] = audio;
      });
    }
    
    return () => {
      // Cleanup audio elements
      Object.values(audioRef.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
      audioRef.current = {};
    };
  }, [state.globalSettings.enableSound, state.globalSettings.sounds]);
  
  // Generate unique notification ID
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${++idCounterRef.current}`;
  }, []);
  
  // Play sound for notification type
  const playSound = useCallback((type: NotificationType) => {
    if (state.globalSettings.enableSound && audioRef.current[type]) {
      try {
        audioRef.current[type]?.play().catch(error => {
          console.warn('Failed to play notification sound:', error);
        });
      } catch (error) {
        console.warn('Sound playback error:', error);
      }
    }
  }, [state.globalSettings.enableSound]);
  
  // Clear non-persistent notifications on route change
  useEffect(() => {
    if (!persistAcrossRoutes) {
      const nonPersistentIds = state.notifications
        .filter(n => !n.persistent)
        .map(n => n.id);
      
      nonPersistentIds.forEach(id => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
      });
    }
  }, [router, persistAcrossRoutes, state.notifications]);
  
  // Context actions implementation
  const actions: NotificationActions = useMemo(() => ({
    addNotification: (notificationData) => {
      const notification: Notification = {
        id: generateId(),
        timestamp: Date.now(),
        position: position,
        isRead: false,
        ...notificationData,
      };
      
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      playSound(notification.type);
      
      return notification.id;
    },
    
    removeNotification: (id) => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    },
    
    clearAll: () => {
      dispatch({ type: 'CLEAR_ALL' });
    },
    
    clearByType: (type) => {
      dispatch({ type: 'CLEAR_BY_TYPE', payload: type });
    },
    
    markAsRead: (id) => {
      dispatch({ type: 'MARK_AS_READ', payload: id });
    },
    
    markAllAsRead: () => {
      dispatch({ type: 'MARK_ALL_AS_READ' });
    },
    
    updateSettings: (newSettings) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
    },
    
    // Convenience methods for common notification types
    success: (title, message, options) => {
      return actions.addNotification({
        type: 'success',
        title,
        message: message || '',
        ...options,
      });
    },
    
    error: (title, message, options) => {
      return actions.addNotification({
        type: 'error',
        title,
        message: message || '',
        persistent: options?.persistent ?? true, // Errors are persistent by default
        ...options,
      });
    },
    
    warning: (title, message, options) => {
      return actions.addNotification({
        type: 'warning',
        title,
        message: message || '',
        ...options,
      });
    },
    
    info: (title, message, options) => {
      return actions.addNotification({
        type: 'info',
        title,
        message: message || '',
        ...options,
      });
    },
    
    loading: (title, message, options) => {
      return actions.addNotification({
        type: 'loading',
        title,
        message: message || '',
        persistent: true, // Loading notifications are always persistent
        duration: 0, // No auto-dismiss for loading
        ...options,
      });
    },
  }), [generateId, position, playSound]);
  
  // Handle action button clicks with error handling
  const handleActionClick = useCallback((actionId: string, handler: () => void | Promise<void>) => {
    // Could be extended to track action analytics or handle common action patterns
    console.log(`Notification action executed: ${actionId}`);
  }, []);
  
  // Context value with optimized memoization
  const contextValue: NotificationContextValue = useMemo(() => ({
    value: state,
    isLoading: false,
    error: null,
    actions,
  }), [state, actions]);
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Notification Container Portal */}
      <NotificationContainer
        notifications={state.notifications}
        position={state.globalSettings.defaultPosition}
        onDismiss={actions.removeNotification}
        onMarkAsRead={actions.markAsRead}
        onActionClick={handleActionClick}
        settings={state.globalSettings}
      />
    </NotificationContext.Provider>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default NotificationProvider;

// Re-export types for external consumption
export type {
  NotificationContextValue,
  NotificationProviderProps,
  Notification,
  NotificationType,
  NotificationPosition,
  NotificationSettings,
  NotificationAction,
} from './provider-types';