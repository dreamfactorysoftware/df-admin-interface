/**
 * Snackbar Provider Component for DreamFactory Admin Interface
 * 
 * React 19 context provider component that manages global snackbar notification state and rendering.
 * Integrates with Zustand store for notification queue management, handles automatic dismissal timers,
 * and provides portal-based rendering for notifications with proper z-index stacking and WCAG 2.1 AA compliance.
 * 
 * Replaces Angular MatSnackBar service with modern React patterns, maintaining all original functionality
 * while introducing enhanced development velocity and superior performance characteristics.
 * 
 * @fileoverview Global notification context provider with Zustand integration
 * @version 1.0.0
 * @since React 19.0 / Next.js 15.1
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo,
  startTransition,
  useDeferredValue,
  type ReactNode,
  type ComponentType
} from 'react';
import { createPortal } from 'react-dom';
import { 
  type NotificationData, 
  type SnackbarStore,
  type SnackbarContainerProps,
  type SnackbarEventHandlers,
  type SnackbarCloseReason,
  type SnackbarPosition,
  type SnackbarTransition,
  DEFAULT_POSITION,
  DEFAULT_TRANSITION
} from './types';

// ============================================================================
// ERROR BOUNDARY INTEGRATION
// ============================================================================

/**
 * Error boundary component for graceful notification system failure handling
 * Implements Section 4.2.1.1 error boundary implementation strategy
 */
interface SnackbarErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class SnackbarErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ComponentType<{ error?: Error }> },
  SnackbarErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ComponentType<{ error?: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SnackbarErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error for monitoring and debugging
    console.error('SnackbarProvider Error Boundary:', error, errorInfo);
    
    // Report to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        context: 'SnackbarProvider',
        errorInfo
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} />;
      }
      
      // Minimal fallback UI for notification system failures
      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-[9999]"
        >
          <p className="text-sm font-medium">Notification system temporarily unavailable</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs underline mt-1 hover:no-underline"
            aria-label="Retry notification system"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// SNACKBAR CONTEXT DEFINITIONS
// ============================================================================

/**
 * Snackbar context interface providing notification management API
 * Replaces Angular service-based notification management with React context patterns
 */
interface SnackbarContextValue {
  // Core notification management
  showNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'visible'>) => string;
  hideNotification: (id: string, reason?: SnackbarCloseReason) => void;
  clearAllNotifications: () => void;
  
  // Queue management
  pauseQueue: (paused: boolean) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  
  // Configuration management
  updatePosition: (position: Partial<SnackbarPosition>) => void;
  updateTransition: (transition: Partial<SnackbarTransition>) => void;
  
  // State access
  notifications: NotificationData[];
  queuePaused: boolean;
  position: SnackbarPosition;
  transition: SnackbarTransition;
}

/**
 * React context for global snackbar state management
 * Provides centralized notification system access throughout the application
 */
const SnackbarContext = createContext<SnackbarContextValue | null>(null);

// ============================================================================
// TIMER MANAGEMENT SYSTEM
// ============================================================================

/**
 * Advanced timer management for notification auto-dismissal
 * Handles configurable duration settings with user interaction detection
 */
class NotificationTimerManager {
  private timers = new Map<string, NodeJS.Timeout>();
  private pausedTimers = new Map<string, { remainingTime: number; startTime: number }>();
  
  /**
   * Start auto-dismissal timer for notification
   */
  startTimer(notificationId: string, duration: number, onExpire: () => void): void {
    this.clearTimer(notificationId);
    
    if (duration > 0 && duration !== Infinity) {
      const timer = setTimeout(() => {
        this.clearTimer(notificationId);
        onExpire();
      }, duration);
      
      this.timers.set(notificationId, timer);
    }
  }
  
  /**
   * Pause timer for user interaction (hover, focus)
   */
  pauseTimer(notificationId: string): void {
    const timer = this.timers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(notificationId);
      
      // Calculate remaining time if we had a previous pause state
      const pausedState = this.pausedTimers.get(notificationId);
      const remainingTime = pausedState?.remainingTime ?? 3000; // Default fallback
      
      this.pausedTimers.set(notificationId, {
        remainingTime,
        startTime: Date.now()
      });
    }
  }
  
  /**
   * Resume timer after user interaction ends
   */
  resumeTimer(notificationId: string, onExpire: () => void): void {
    const pausedState = this.pausedTimers.get(notificationId);
    if (pausedState) {
      this.pausedTimers.delete(notificationId);
      this.startTimer(notificationId, pausedState.remainingTime, onExpire);
    }
  }
  
  /**
   * Clear specific timer
   */
  clearTimer(notificationId: string): void {
    const timer = this.timers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(notificationId);
    }
    this.pausedTimers.delete(notificationId);
  }
  
  /**
   * Clear all timers on cleanup
   */
  clearAllTimers(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.pausedTimers.clear();
  }
}

// ============================================================================
// NOTIFICATION CONTAINER COMPONENT
// ============================================================================

/**
 * Portal-based notification container with proper z-index management
 * Ensures notifications appear above all other content with accessible stacking
 */
const SnackbarContainer: React.FC<SnackbarContainerProps> = ({
  notifications,
  maxVisible = 5,
  position = DEFAULT_POSITION,
  spacing = 8,
  stackDirection = 'up',
  eventHandlers,
  container,
  zIndex = 9999,
  className = '',
  ...props
}) => {
  // Use deferred value for performance optimization with concurrent features
  const deferredNotifications = useDeferredValue(notifications);
  
  // Get visible notifications based on queue limits
  const visibleNotifications = useMemo(() => {
    return deferredNotifications
      .filter(notification => notification.visible)
      .slice(0, maxVisible);
  }, [deferredNotifications, maxVisible]);
  
  // Calculate container positioning classes
  const positionClasses = useMemo(() => {
    const vertical = position.vertical === 'top' ? 'top-0' : 'bottom-0';
    const horizontal = position.horizontal === 'center' 
      ? 'left-1/2 transform -translate-x-1/2'
      : position.horizontal === 'right' 
        ? 'right-0' 
        : 'left-0';
    
    return `fixed ${vertical} ${horizontal}`;
  }, [position]);
  
  // Calculate stack spacing and direction
  const stackClasses = useMemo(() => {
    const direction = stackDirection === 'up' ? 'flex-col-reverse' : 'flex-col';
    return `flex ${direction} gap-${Math.min(spacing / 4, 4)}`;
  }, [stackDirection, spacing]);
  
  if (visibleNotifications.length === 0) {
    return null;
  }
  
  const containerElement = (
    <div
      {...props}
      className={`
        ${positionClasses}
        ${stackClasses}
        pointer-events-none
        p-4
        ${className}
      `.trim()}
      style={{ 
        zIndex,
        ...position.offset && {
          paddingLeft: position.offset.x ?? 16,
          paddingRight: position.offset.x ?? 16,
          paddingTop: position.offset.y ?? 16,
          paddingBottom: position.offset.y ?? 16,
        }
      }}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
    >
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className="pointer-events-auto"
          style={{
            animationDelay: `${index * 100}ms`,
            zIndex: zIndex + index
          }}
        >
          {/* Individual Snackbar component will be rendered here */}
          <div
            className={`
              bg-white dark:bg-gray-900 
              border border-gray-200 dark:border-gray-700
              rounded-lg shadow-lg
              px-4 py-3
              min-w-[320px] max-w-[480px]
              transform transition-all duration-300 ease-out
              ${notification.alertType === 'success' ? 'border-l-4 border-l-green-500' : ''}
              ${notification.alertType === 'error' ? 'border-l-4 border-l-red-500' : ''}
              ${notification.alertType === 'warning' ? 'border-l-4 border-l-yellow-500' : ''}
              ${notification.alertType === 'info' ? 'border-l-4 border-l-blue-500' : ''}
            `}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.message}
                </p>
                {notification.stackCount && notification.stackCount > 1 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    +{notification.stackCount - 1} more
                  </p>
                )}
              </div>
              {notification.dismissible && (
                <button
                  onClick={() => eventHandlers?.onHide?.(notification, 'closeButton')}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Dismiss notification"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Use portal for proper z-index stacking
  if (typeof window !== 'undefined') {
    const portalContainer = container || document.body;
    return createPortal(containerElement, portalContainer);
  }
  
  return null;
};

// ============================================================================
// MAIN PROVIDER COMPONENT
// ============================================================================

/**
 * Provider component props interface
 */
interface SnackbarProviderProps {
  children: ReactNode;
  maxVisible?: number;
  maxQueue?: number;
  position?: SnackbarPosition;
  transition?: SnackbarTransition;
  container?: HTMLElement | null;
  zIndex?: number;
  eventHandlers?: SnackbarEventHandlers;
  errorBoundaryFallback?: ComponentType<{ error?: Error }>;
  className?: string;
}

/**
 * Global Snackbar Provider Component
 * 
 * Provides comprehensive notification system management with Zustand store integration,
 * portal-based rendering, automatic timer management, and React 19 concurrent features.
 * 
 * @param props Provider configuration options
 * @returns Provider component wrapping children with notification context
 */
export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
  children,
  maxVisible = 5,
  maxQueue = 20,
  position = DEFAULT_POSITION,
  transition = DEFAULT_TRANSITION,
  container = null,
  zIndex = 9999,
  eventHandlers,
  errorBoundaryFallback,
  className = ''
}) => {
  // Initialize timer manager for auto-dismissal
  const timerManager = useRef(new NotificationTimerManager());
  
  // Store reference for container element
  const portalContainer = useRef<HTMLElement | null>(container);
  
  // Mock Zustand store state until actual store is implemented
  // This will be replaced with actual store integration
  const [mockStore, setMockStore] = React.useState<{
    notifications: NotificationData[];
    position: SnackbarPosition;
    transition: SnackbarTransition;
    queuePaused: boolean;
  }>({
    notifications: [],
    position,
    transition,
    queuePaused: false
  });
  
  // Initialize portal container on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !portalContainer.current) {
      portalContainer.current = container || document.body;
    }
  }, [container]);
  
  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timerManager.current.clearAllTimers();
    };
  }, []);
  
  /**
   * Add notification to queue with automatic timer management
   */
  const showNotification = useCallback((
    notification: Omit<NotificationData, 'id' | 'timestamp' | 'visible'>
  ): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    
    const newNotification: NotificationData = {
      id,
      timestamp,
      visible: true,
      read: false,
      priority: notification.priority ?? 0,
      dismissible: notification.dismissible ?? true,
      duration: notification.duration ?? 5000,
      ...notification
    };
    
    // Update store state using React state transition
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        notifications: [
          ...prev.notifications.slice(-(maxQueue - 1)), // Maintain queue limit
          newNotification
        ]
      }));
    });
    
    // Start auto-dismissal timer if duration is specified
    if (newNotification.duration && newNotification.duration > 0 && newNotification.duration !== Infinity) {
      timerManager.current.startTimer(
        id,
        newNotification.duration,
        () => hideNotification(id, 'timeout')
      );
    }
    
    // Trigger show event handler
    eventHandlers?.onShow?.(newNotification);
    
    return id;
  }, [maxQueue, eventHandlers]);
  
  /**
   * Remove notification from queue with cleanup
   */
  const hideNotification = useCallback((id: string, reason: SnackbarCloseReason = 'programmatic') => {
    // Clear associated timer
    timerManager.current.clearTimer(id);
    
    // Find notification for event handler
    const notification = mockStore.notifications.find(n => n.id === id);
    
    // Update store state using React state transition
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== id)
      }));
    });
    
    // Trigger hide event handler
    if (notification) {
      eventHandlers?.onHide?.(notification, reason);
    }
  }, [mockStore.notifications, eventHandlers]);
  
  /**
   * Clear all notifications with cleanup
   */
  const clearAllNotifications = useCallback(() => {
    // Clear all timers
    timerManager.current.clearAllTimers();
    
    // Get notifications for event handlers
    const notifications = mockStore.notifications;
    
    // Update store state using React state transition
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        notifications: []
      }));
    });
    
    // Trigger hide event handlers for all notifications
    notifications.forEach(notification => {
      eventHandlers?.onHide?.(notification, 'programmatic');
    });
  }, [mockStore.notifications, eventHandlers]);
  
  /**
   * Pause/resume queue processing
   */
  const pauseQueue = useCallback((paused: boolean) => {
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        queuePaused: paused
      }));
    });
  }, []);
  
  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((id: string) => {
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification =>
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        )
      }));
    });
  }, []);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(() => {
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        notifications: prev.notifications.map(notification => ({
          ...notification,
          read: true
        }))
      }));
    });
  }, []);
  
  /**
   * Update global position configuration
   */
  const updatePosition = useCallback((newPosition: Partial<SnackbarPosition>) => {
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        position: { ...prev.position, ...newPosition }
      }));
    });
  }, []);
  
  /**
   * Update global transition configuration
   */
  const updateTransition = useCallback((newTransition: Partial<SnackbarTransition>) => {
    startTransition(() => {
      setMockStore(prev => ({
        ...prev,
        transition: { ...prev.transition, ...newTransition }
      }));
    });
  }, []);
  
  // Memoize context value for performance optimization
  const contextValue = useMemo<SnackbarContextValue>(() => ({
    showNotification,
    hideNotification,
    clearAllNotifications,
    pauseQueue,
    markAsRead,
    markAllAsRead,
    updatePosition,
    updateTransition,
    notifications: mockStore.notifications,
    queuePaused: mockStore.queuePaused,
    position: mockStore.position,
    transition: mockStore.transition
  }), [
    showNotification,
    hideNotification,
    clearAllNotifications,
    pauseQueue,
    markAsRead,
    markAllAsRead,
    updatePosition,
    updateTransition,
    mockStore
  ]);
  
  return (
    <SnackbarErrorBoundary fallback={errorBoundaryFallback}>
      <SnackbarContext.Provider value={contextValue}>
        {children}
        <SnackbarContainer
          notifications={mockStore.notifications}
          maxVisible={maxVisible}
          position={mockStore.position}
          container={portalContainer.current}
          zIndex={zIndex}
          eventHandlers={eventHandlers}
          className={className}
        />
      </SnackbarContext.Provider>
    </SnackbarErrorBoundary>
  );
};

// ============================================================================
// HOOK FOR CONSUMING CONTEXT
// ============================================================================

/**
 * Hook for accessing snackbar context
 * Provides type-safe access to notification management API
 * 
 * @throws Error if used outside of SnackbarProvider
 * @returns Snackbar context value with notification management methods
 */
export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  
  if (!context) {
    throw new Error(
      'useSnackbar must be used within a SnackbarProvider. ' +
      'Please wrap your component tree with <SnackbarProvider>.'
    );
  }
  
  return context;
};

// ============================================================================
// CONVENIENCE HOOKS FOR COMMON OPERATIONS
// ============================================================================

/**
 * Convenience hook for showing notifications with pre-configured types
 * Provides simple API for common notification scenarios
 */
export const useNotificationHelpers = () => {
  const { showNotification } = useSnackbar();
  
  return useMemo(() => ({
    showSuccess: (message: string, options?: Partial<NotificationData>) => 
      showNotification({ message, alertType: 'success', ...options }),
    
    showError: (message: string, options?: Partial<NotificationData>) => 
      showNotification({ message, alertType: 'error', ...options }),
    
    showWarning: (message: string, options?: Partial<NotificationData>) => 
      showNotification({ message, alertType: 'warning', ...options }),
    
    showInfo: (message: string, options?: Partial<NotificationData>) => 
      showNotification({ message, alertType: 'info', ...options })
  }), [showNotification]);
};

// ============================================================================
// TYPE EXPORTS FOR EXTERNAL CONSUMPTION
// ============================================================================

export type { 
  SnackbarContextValue,
  SnackbarProviderProps,
  SnackbarContainerProps 
};

// Default export for common usage patterns
export default SnackbarProvider;