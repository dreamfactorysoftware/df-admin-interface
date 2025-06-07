/**
 * Snackbar Component System - Barrel Export File
 * 
 * Centralized export hub for the snackbar notification system providing clean import patterns
 * and optimal tree-shaking for Next.js 15.1 and Turbopack bundling. Replaces Angular MatSnackBar
 * service with modern React 19 component architecture while maintaining full feature parity.
 * 
 * Features:
 * - React 19 Snackbar component with WCAG 2.1 AA accessibility compliance
 * - SnackbarProvider context with Zustand store integration for global state management
 * - useSnackbar hook for consuming snackbar functionality across the application
 * - Comprehensive TypeScript interface exports for external type safety
 * - Tree-shaking optimized exports compatible with Next.js build system
 * - Utility functions, type guards, and default configurations
 * - Hook exports for notification management patterns
 * 
 * @fileoverview Barrel export file for snackbar notification system
 * @version 1.0.0
 * @since React 19.0 / Next.js 15.1
 */

// =============================================================================
// Primary Component Exports
// =============================================================================

/**
 * Main Snackbar component - React 19 notification component with accessibility support
 * Replaces Angular df-snackbar with modern React patterns
 */
export { Snackbar, default as SnackbarComponent } from './Snackbar';

/**
 * SnackbarProvider - React context provider with Zustand integration
 * Provides global notification state management and portal rendering
 */
export { 
  SnackbarProvider, 
  default as SnackbarProviderComponent 
} from './SnackbarProvider';

/**
 * useSnackbar hook - Primary hook for consuming snackbar functionality
 * Provides methods for showing notifications and managing global state
 */
export { useSnackbar } from './SnackbarProvider';

// =============================================================================
// TypeScript Type and Interface Exports
// =============================================================================

/**
 * Core alert type enumeration and related types
 * Maintains compatibility with existing Angular implementation
 */
export { 
  AlertType,
  type AlertSeverity 
} from './types';

/**
 * Component props interfaces for external consumption
 * Enables proper typing when using snackbar components
 */
export type { 
  SnackbarProps,
  SnackbarContainerProps 
} from './types';

/**
 * Provider and context related type exports
 * Required for proper typing of provider props and context usage
 */
export type {
  SnackbarProviderProps,
  SnackbarContextValue,
  SnackbarSettings
} from './SnackbarProvider';

/**
 * Notification data structures and queue management types
 * Essential for notification creation and state management
 */
export type {
  NotificationData,
  NotificationQueue,
  NotificationBuilder,
  NotificationFilter,
  NotificationSort,
  QueueOperationResult,
  NotificationAnalytics
} from './types';

/**
 * Configuration and behavior types
 * Required for customizing snackbar behavior and appearance
 */
export type {
  SnackbarAction,
  SnackbarIcon,
  SnackbarPosition,
  SnackbarTransition,
  SnackbarConfiguration,
  SnackbarEventHandlers,
  SnackbarCloseReason
} from './types';

/**
 * Duration and timing configuration types
 * For controlling notification display durations and accessibility timing
 */
export type {
  DurationConfig,
  DurationPreset,
  DurationPresets
} from './types';

/**
 * Theme and styling configuration types
 * Enables customization of snackbar appearance with Tailwind CSS
 */
export type {
  SnackbarTheme,
  SnackbarAccessibility
} from './types';

/**
 * Store and state management types
 * Required for integration with Zustand store and external state management
 */
export type {
  SnackbarStore
} from './types';

// =============================================================================
// Legacy Compatibility Exports (for Angular migration)
// =============================================================================

/**
 * Legacy type aliases for smoother Angular to React migration
 * Maintains familiar naming patterns from Angular MatSnackBar
 */
export type {
  SnackbarAction as MatSnackBarAction,
  SnackbarPosition as MatSnackBarPosition,
  AlertSeverity as MatSnackBarType,
  NotificationData as SnackbarData,
  SnackbarCloseReason as MatSnackBarDismiss
} from './types';

// =============================================================================
// Utility Exports
// =============================================================================

/**
 * Type guard functions for runtime type checking
 * Enables safe type narrowing and validation in consuming code
 */
export { 
  isValidAlertType,
  isNotificationData 
} from './types';

/**
 * Default configuration objects
 * Provides standard configurations for common use cases
 */
export {
  DEFAULT_DURATION_PRESETS,
  DEFAULT_POSITION,
  DEFAULT_TRANSITION
} from './types';

// =============================================================================
// Provider Pattern Exports for Advanced Usage
// =============================================================================

/**
 * Provider-related exports from SnackbarProvider for advanced scenarios
 * Includes additional types and interfaces for provider customization
 */
export type {
  SnackbarNotification,
  SnackbarOptions
} from './SnackbarProvider';

// =============================================================================
// Convenience Re-exports
// =============================================================================

/**
 * Re-export AlertType enum values as constants for easier usage
 * Provides direct access to alert types without enum syntax
 */
export const ALERT_TYPES = {
  SUCCESS: AlertType.SUCCESS,
  WARNING: AlertType.WARNING,
  ERROR: AlertType.ERROR,
  INFO: AlertType.INFO
} as const;

/**
 * Common duration constants for convenience
 * Standard durations following UX best practices
 */
export const NOTIFICATION_DURATIONS = {
  /** Quick acknowledgment for success messages */
  SHORT: 3000,
  /** Standard duration for most notifications */
  MEDIUM: 5000,
  /** Extended duration for important messages */
  LONG: 8000,
  /** No auto-dismiss for critical messages */
  PERSISTENT: null
} as const;

/**
 * Standard position configurations for common layouts
 * Pre-configured positions for quick setup
 */
export const STANDARD_POSITIONS = {
  TOP_LEFT: { vertical: 'top' as const, horizontal: 'left' as const },
  TOP_CENTER: { vertical: 'top' as const, horizontal: 'center' as const },
  TOP_RIGHT: { vertical: 'top' as const, horizontal: 'right' as const },
  BOTTOM_LEFT: { vertical: 'bottom' as const, horizontal: 'left' as const },
  BOTTOM_CENTER: { vertical: 'bottom' as const, horizontal: 'center' as const },
  BOTTOM_RIGHT: { vertical: 'bottom' as const, horizontal: 'right' as const }
} as const;

// =============================================================================
// Default Export
// =============================================================================

/**
 * Default export - Primary Snackbar component
 * Follows React component library conventions for default exports
 */
export { default } from './Snackbar';

// =============================================================================
// Namespace Export for Bulk Imports
// =============================================================================

/**
 * Namespace export for scenarios requiring bulk import
 * Enables: import * as Snackbar from '@/components/ui/snackbar'
 */
export * as SnackbarSystem from './types';
export * as SnackbarHooks from './SnackbarProvider';

// =============================================================================
// JSDoc Type Documentation
// =============================================================================

/**
 * @example Basic Usage
 * ```tsx
 * import { Snackbar, SnackbarProvider, useSnackbar } from '@/components/ui/snackbar';
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
 *   const { showSuccess, showError } = useSnackbar();
 *   
 *   const handleSuccess = () => {
 *     showSuccess('Operation completed successfully!');
 *   };
 *   
 *   const handleError = () => {
 *     showError('An error occurred. Please try again.');
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>Success</button>
 *       <button onClick={handleError}>Error</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example Advanced Configuration
 * ```tsx
 * import { 
 *   SnackbarProvider, 
 *   useSnackbar, 
 *   STANDARD_POSITIONS,
 *   NOTIFICATION_DURATIONS,
 *   type SnackbarOptions 
 * } from '@/components/ui/snackbar';
 * 
 * const customOptions: SnackbarOptions = {
 *   duration: NOTIFICATION_DURATIONS.LONG,
 *   persistent: false,
 *   dismissible: true,
 *   action: {
 *     label: 'Undo',
 *     handler: () => console.log('Undo clicked'),
 *     variant: 'primary'
 *   }
 * };
 * 
 * function App() {
 *   return (
 *     <SnackbarProvider 
 *       position="bottom-right"
 *       maxQueueSize={5}
 *       settings={{
 *         defaultDuration: NOTIFICATION_DURATIONS.MEDIUM,
 *         maxVisible: 3
 *       }}
 *     >
 *       <MyComponent />
 *     </SnackbarProvider>
 *   );
 * }
 * ```
 * 
 * @example Type-Safe Notification Management
 * ```tsx
 * import { 
 *   useSnackbar, 
 *   AlertType,
 *   type NotificationData,
 *   type SnackbarAction 
 * } from '@/components/ui/snackbar';
 * 
 * function NotificationManager() {
 *   const { 
 *     showSnackbar, 
 *     notifications, 
 *     dismissSnackbar 
 *   } = useSnackbar();
 *   
 *   const showCustomNotification = () => {
 *     const action: SnackbarAction = {
 *       label: 'View Details',
 *       handler: () => console.log('Details viewed'),
 *       variant: 'outlined'
 *     };
 *     
 *     showSnackbar(AlertType.INFO, 'Custom notification', {
 *       action,
 *       duration: 10000
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={showCustomNotification}>
 *         Show Custom Notification
 *       </button>
 *       <div>
 *         Active notifications: {notifications.length}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */