/**
 * @fileoverview Barrel export file for the snackbar notification component system
 * 
 * This file provides centralized exports for all snackbar-related components, hooks,
 * types, and utilities. Following React library patterns for optimal tree-shaking
 * and clean imports throughout the application.
 * 
 * @version React 19 / Next.js 15.1
 * @author DreamFactory Platform Team
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Main Snackbar component - toast-style notification with dismissible functionality
 * Implements accessible notifications using Headless UI, Tailwind CSS animations,
 * and React 19 concurrent features for optimal performance.
 */
export { default as Snackbar } from './Snackbar';

/**
 * SnackbarProvider - React context provider for global notification management
 * Integrates with Zustand store for notification queue management, handles
 * automatic dismissal timers, and provides portal-based rendering.
 */
export { default as SnackbarProvider, SnackbarProviderProps } from './SnackbarProvider';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Core TypeScript interfaces and types for snackbar system
 * Provides comprehensive type safety for notification queue management,
 * component props, and Zustand store integration.
 */
export type {
  // Alert severity types matching original Angular implementation
  AlertType,
  
  // Snackbar component props interface
  SnackbarProps,
  
  // Notification data structure for queue management
  NotificationData,
  
  // Action handler interfaces
  SnackbarAction,
  NotificationAction,
  
  // Configuration interfaces
  SnackbarConfig,
  NotificationConfig,
  
  // Theme and styling types
  SnackbarVariant,
  NotificationPosition,
  
  // Queue management types
  NotificationQueue,
  QueueOptions,
  
  // Duration and timing types
  DurationConfig,
  TimingOptions,
  
  // Accessibility types
  SnackbarAriaProps,
  NotificationAriaLabels,
} from './types';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * Primary notification management hook
 * Provides toast notification functionality, queue management,
 * and integration with the global notification state.
 */
export { useNotifications } from '../../../hooks/use-notifications';

/**
 * Snackbar-specific hooks for component state management
 * These hooks are re-exported for convenience and better component coupling.
 */
export type {
  // Hook return types for external consumption
  UseNotificationsReturn,
  NotificationMethods,
  NotificationState,
} from '../../../hooks/use-notifications';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Utility functions for notification management
 * These are typically used internally but exported for advanced use cases.
 */
export {
  // Notification queue utilities
  createNotification,
  dismissNotification,
  clearAllNotifications,
  
  // Icon mapping utilities
  getAlertIcon,
  getAlertColor,
  
  // Duration helpers
  getDefaultDuration,
  calculateDismissalTime,
  
  // Accessibility helpers
  generateNotificationId,
  getAriaAttributes,
} from './types';

// =============================================================================
// CONSTANT EXPORTS
// =============================================================================

/**
 * Default configuration constants for snackbar system
 * Provides consistent defaults across the application.
 */
export {
  DEFAULT_SNACKBAR_DURATION,
  DEFAULT_QUEUE_LIMIT,
  SNACKBAR_POSITIONS,
  ALERT_TYPES,
  ANIMATION_DURATIONS,
  Z_INDEX_VALUES,
} from './types';

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default export for the primary Snackbar component
 * Follows React component library conventions for primary component access.
 * 
 * @example
 * ```tsx
 * import Snackbar from '@/components/ui/snackbar';
 * import { SnackbarProvider, useNotifications } from '@/components/ui/snackbar';
 * 
 * function App() {
 *   return (
 *     <SnackbarProvider>
 *       <MyComponent />
 *     </SnackbarProvider>
 *   );
 * }
 * 
 * function MyComponent() {
 *   const { showNotification } = useNotifications();
 *   
 *   const handleSuccess = () => {
 *     showNotification('Operation completed successfully!', 'success');
 *   };
 *   
 *   return <button onClick={handleSuccess}>Complete Action</button>;
 * }
 * ```
 */
export { default } from './Snackbar';

// =============================================================================
// TYPE-ONLY RE-EXPORTS
// =============================================================================

/**
 * Re-export types from related UI components for convenience
 * Allows importing all UI-related types from a single location.
 */
export type {
  AlertType as UIAlertType,
} from '../alert/types';

/**
 * Re-export common UI types that work with snackbar system
 */
export type {
  ThemeVariant,
  ComponentSize,
  AnimationDuration,
} from '../../../types/ui';