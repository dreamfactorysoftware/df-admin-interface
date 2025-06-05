/**
 * @fileoverview Confirm Dialog Component System - Barrel Export Module
 * 
 * Provides clean imports for the specialized confirmation dialog component system migrated from Angular Material
 * to React 19/Next.js 15.1 with TypeScript 5.8+ support. This barrel export enables centralized access to 
 * confirmation dialog components, utilities, and type definitions throughout the application.
 * 
 * Migration Context:
 * - Replaces Angular Material MatDialog confirmation patterns with React 19 promise-based architecture
 * - Implements WCAG 2.1 AA accessibility compliance per Section 7.7.1
 * - Supports mobile-first responsive design per Section 7.7.3
 * - Integrates with Tailwind CSS 4.1+ animation system per Section 7.1.1
 * - Provides Next.js 15.1 app router compatibility
 * - Maintains backward compatibility with existing Angular dialog usage patterns where possible
 * 
 * Key Features:
 * - Promise-based confirmation workflows for async operations
 * - Standardized confirmation and cancellation button patterns
 * - Destructive action protection with enhanced visual indicators
 * - Text confirmation requirements for critical operations
 * - Responsive design with mobile-first approach
 * - Comprehensive TypeScript type safety
 * - Accessibility-first implementation with focus management
 * - Integration with database service operations and API generation workflows
 * 
 * Usage Examples:
 * ```tsx
 * // Basic confirmation dialog
 * import { ConfirmDialog, useConfirmDialog } from '@/components/ui/confirm-dialog';
 * 
 * function DatabaseServiceList() {
 *   const { confirm } = useConfirmDialog();
 *   
 *   const handleDeleteService = async (serviceId: string) => {
 *     const confirmed = await confirm({
 *       title: 'Delete Database Service',
 *       message: 'Are you sure you want to delete this database service? All generated APIs will be removed.',
 *       confirmText: 'Delete Service',
 *       destructive: true
 *     });
 *     
 *     if (confirmed) {
 *       await deleteService(serviceId);
 *     }
 *   };
 * }
 * 
 * // Critical operation with text confirmation
 * const handleDeleteAllData = async () => {
 *   const confirmed = await confirm({
 *     title: 'Delete All Database Data',
 *     message: 'This will permanently delete all data in the database. This action cannot be undone.',
 *     requireTextConfirmation: true,
 *     confirmationText: 'DELETE ALL DATA',
 *     confirmText: 'Permanently Delete',
 *     destructive: true
 *   });
 *   
 *   if (confirmed) {
 *     await deleteAllData();
 *   }
 * };
 * ```
 * 
 * @author DreamFactory Admin Interface Team
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @license MIT
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Main ConfirmDialog Component
 * 
 * The ConfirmDialog component provides a standardized confirmation interface for user actions,
 * particularly useful for destructive operations in database service management and API generation
 * workflows. Built on React 19's enhanced concurrent features for optimal performance.
 * 
 * Features:
 * - Promise-based confirmation workflows
 * - Destructive action protection with visual indicators
 * - Text confirmation requirements for critical operations
 * - Responsive behavior with mobile-optimized touch targets
 * - WCAG 2.1 AA compliant focus management
 * - Integration with existing dialog system architecture
 * - Support for async operations with loading states
 * 
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Database Connection"
 *   message="This will remove the database connection and all associated API endpoints."
 *   confirmText="Delete Connection"
 *   destructive={true}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export { ConfirmDialog as default, ConfirmDialog } from './confirm-dialog';

// =============================================================================
// HOOK EXPORTS
// =============================================================================

/**
 * useConfirmDialog Hook - Promise-Based Confirmation Management
 * 
 * Provides imperative confirmation dialog management with promise-based workflows,
 * enabling clean async/await patterns for user confirmation in React components.
 * Integrates seamlessly with database service operations and API generation flows.
 * 
 * Features:
 * - Promise-based confirmation with async/await support
 * - Type-safe confirmation data handling
 * - Integration with React 19 concurrent features
 * - Automatic cleanup and memory management
 * - Support for multiple confirmation types (basic, destructive, text-required)
 * - Loading state management for async operations
 * 
 * @returns Object containing confirmation methods and state management
 * 
 * @example
 * ```tsx
 * function DatabaseServiceManager() {
 *   const { confirm, confirmDestructive, confirmWithText } = useConfirmDialog();
 *   
 *   const handleDeleteService = async (service: DatabaseService) => {
 *     const confirmed = await confirmDestructive({
 *       title: 'Delete Database Service',
 *       message: `Delete "${service.name}"? All generated APIs will be removed.`,
 *       confirmText: 'Delete Service'
 *     });
 *     
 *     if (confirmed) {
 *       await apiClient.deleteService(service.id);
 *     }
 *   };
 *   
 *   const handleDropDatabase = async (database: string) => {
 *     const confirmed = await confirmWithText({
 *       title: 'Drop Database',
 *       message: 'This will permanently delete the entire database and all its data.',
 *       confirmationText: database,
 *       confirmText: 'Drop Database'
 *     });
 *     
 *     if (confirmed) {
 *       await apiClient.dropDatabase(database);
 *     }
 *   };
 * }
 * ```
 */
export { useConfirmDialog } from './confirm-dialog';

/**
 * useConfirmation Hook - Stateful Confirmation Management
 * 
 * Provides stateful confirmation dialog management for controlled component patterns,
 * offering more granular control over dialog state and configuration. Useful for
 * complex confirmation flows that require custom state management.
 * 
 * Features:
 * - Controlled state management
 * - Custom confirmation data handling
 * - Integration with form validation
 * - Support for multi-step confirmation processes
 * - Type-safe configuration options
 * 
 * @returns Object containing confirmation state and control methods
 * 
 * @example
 * ```tsx
 * function SchemaModificationDialog() {
 *   const { 
 *     isOpen, 
 *     confirmationData, 
 *     openConfirmation, 
 *     closeConfirmation,
 *     handleConfirm,
 *     handleCancel 
 *   } = useConfirmation();
 *   
 *   const handleModifySchema = (changes: SchemaChanges) => {
 *     openConfirmation({
 *       title: 'Modify Database Schema',
 *       message: 'This will make structural changes to your database.',
 *       data: changes,
 *       destructive: changes.hasBreakingChanges
 *     });
 *   };
 * }
 * ```
 */
export { useConfirmation } from './confirm-dialog';

// =============================================================================
// UTILITY FUNCTION EXPORTS
// =============================================================================

/**
 * Imperative Confirmation Functions
 * 
 * Standalone utility functions for confirmation dialogs that can be used
 * without React components, useful for service layers and utility functions.
 */

/**
 * confirmAction - Basic confirmation utility
 * 
 * Creates and displays a basic confirmation dialog with standard confirmation
 * and cancellation options. Returns a promise that resolves to boolean.
 * 
 * @param options - Configuration options for the confirmation dialog
 * @returns Promise that resolves to true if confirmed, false if cancelled
 * 
 * @example
 * ```tsx
 * import { confirmAction } from '@/components/ui/confirm-dialog';
 * 
 * const handleLogout = async () => {
 *   const confirmed = await confirmAction({
 *     title: 'Confirm Logout',
 *     message: 'Are you sure you want to log out?',
 *     confirmText: 'Log Out'
 *   });
 *   
 *   if (confirmed) {
 *     await authService.logout();
 *   }
 * };
 * ```
 */
export { confirmAction } from './confirm-dialog';

/**
 * confirmDestructive - Destructive action confirmation
 * 
 * Creates and displays a confirmation dialog specifically styled for destructive
 * actions, with enhanced visual indicators and safety measures.
 * 
 * @param options - Configuration options with destructive action styling
 * @returns Promise that resolves to true if confirmed, false if cancelled
 * 
 * @example
 * ```tsx
 * import { confirmDestructive } from '@/components/ui/confirm-dialog';
 * 
 * const handleDeleteAllServices = async () => {
 *   const confirmed = await confirmDestructive({
 *     title: 'Delete All Services',
 *     message: 'This will permanently delete all database services and their APIs.',
 *     confirmText: 'Delete All'
 *   });
 *   
 *   if (confirmed) {
 *     await serviceManager.deleteAllServices();
 *   }
 * };
 * ```
 */
export { confirmDestructive } from './confirm-dialog';

/**
 * confirmWithTextValidation - Text confirmation utility
 * 
 * Creates and displays a confirmation dialog that requires the user to type
 * a specific confirmation text before allowing the action to proceed. Used
 * for highly critical or irreversible operations.
 * 
 * @param options - Configuration options including required confirmation text
 * @returns Promise that resolves to true if confirmed with correct text, false otherwise
 * 
 * @example
 * ```tsx
 * import { confirmWithTextValidation } from '@/components/ui/confirm-dialog';
 * 
 * const handleDropDatabase = async (databaseName: string) => {
 *   const confirmed = await confirmWithTextValidation({
 *     title: 'Drop Database',
 *     message: `Type "${databaseName}" to confirm database deletion.`,
 *     confirmationText: databaseName,
 *     confirmText: 'Drop Database'
 *   });
 *   
 *   if (confirmed) {
 *     await databaseService.dropDatabase(databaseName);
 *   }
 * };
 * ```
 */
export { confirmWithTextValidation } from './confirm-dialog';

/**
 * showConfirmDialog - Generic confirmation dialog
 * 
 * Generic utility function for displaying confirmation dialogs with full
 * customization options and promise-based resolution. Provides the most
 * flexibility for complex confirmation scenarios.
 * 
 * @param config - Complete confirmation dialog configuration
 * @returns Promise that resolves to confirmation result data
 * 
 * @example
 * ```tsx
 * import { showConfirmDialog } from '@/components/ui/confirm-dialog';
 * 
 * const handleCustomConfirmation = async () => {
 *   const result = await showConfirmDialog({
 *     title: 'Custom Confirmation',
 *     message: 'Please choose an option:',
 *     confirmText: 'Proceed',
 *     cancelText: 'Cancel',
 *     destructive: false,
 *     variant: 'default',
 *     data: { operation: 'custom' }
 *   });
 *   
 *   if (result.confirmed) {
 *     console.log('User confirmed with data:', result.data);
 *   }
 * };
 * ```
 */
export { showConfirmDialog } from './confirm-dialog';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Core Interface Exports
 * 
 * Comprehensive TypeScript interfaces for all confirm dialog components, providing
 * complete type safety and IntelliSense support throughout the application.
 * These interfaces ensure proper integration with database service operations
 * and API generation workflows.
 */

/**
 * ConfirmDialogProps - Main confirm dialog component interface
 * 
 * Comprehensive interface for the ConfirmDialog component including configuration
 * options, callback handlers, accessibility properties, and integration with
 * the existing dialog system architecture.
 * 
 * Key Properties:
 * - title: Dialog title text
 * - message: Confirmation message content
 * - confirmText: Text for confirmation button
 * - cancelText: Text for cancellation button
 * - destructive: Indicates if action is destructive (styling changes)
 * - requireTextConfirmation: Requires user to type confirmation text
 * - confirmationText: Required text for text confirmation
 * - onConfirm: Callback when user confirms action
 * - onCancel: Callback when user cancels action
 * - loading: Shows loading state during async operations
 * - disabled: Disables confirmation button
 * - variant: Visual variant (default, warning, danger)
 * - size: Dialog size configuration
 * - data: Additional data passed to callbacks
 * 
 * @example
 * ```tsx
 * const dialogProps: ConfirmDialogProps = {
 *   title: 'Delete Service',
 *   message: 'This action cannot be undone.',
 *   confirmText: 'Delete',
 *   destructive: true,
 *   onConfirm: async () => await deleteService(),
 *   onCancel: () => setDialogOpen(false)
 * };
 * ```
 */
export type { ConfirmDialogProps } from './types';

/**
 * ConfirmDialogData - Configuration data interface
 * 
 * Interface for configuration data passed to confirmation dialogs, providing
 * type-safe access to dialog configuration and user-provided data. Used by
 * utility functions and imperative dialog creation methods.
 * 
 * Key Properties:
 * - Configuration options (title, message, buttons)
 * - Behavioral flags (destructive, requireTextConfirmation)
 * - Styling options (variant, size)
 * - Custom data payload
 * - Accessibility configurations
 * - Responsive behavior settings
 * 
 * @example
 * ```tsx
 * const confirmationData: ConfirmDialogData = {
 *   title: 'Database Connection Test',
 *   message: 'Test connection to the selected database?',
 *   confirmText: 'Test Connection',
 *   cancelText: 'Cancel',
 *   variant: 'default',
 *   data: { serviceId: 'mysql-prod', timeout: 30000 }
 * };
 * ```
 */
export type { ConfirmDialogData } from './types';

/**
 * ConfirmDialogResult - Promise resolution interface
 * 
 * Interface for the result object returned by promise-based confirmation
 * dialogs, providing information about user decision and any associated data.
 * 
 * Key Properties:
 * - confirmed: Boolean indicating if user confirmed the action
 * - cancelled: Boolean indicating if user cancelled the action
 * - data: Any data associated with the confirmation
 * - timestamp: When the confirmation was made
 * - source: How the dialog was closed (button, escape, outside click)
 * 
 * @example
 * ```tsx
 * const result: ConfirmDialogResult<ServiceData> = await confirm({
 *   title: 'Delete Service',
 *   data: { serviceId: 'mysql-prod' }
 * });
 * 
 * if (result.confirmed) {
 *   console.log('Service to delete:', result.data.serviceId);
 *   console.log('Confirmed at:', result.timestamp);
 * }
 * ```
 */
export type { ConfirmDialogResult } from './types';

/**
 * Hook Return Type Interfaces
 * 
 * Type definitions for confirmation dialog hook return values, providing
 * type-safe access to confirmation methods and state management.
 */

/**
 * UseConfirmDialogReturn - Imperative confirmation hook interface
 * 
 * Interface for the useConfirmDialog hook return value, providing promise-based
 * confirmation methods with full type safety and integration support.
 * 
 * Key Properties:
 * - confirm: Basic confirmation method
 * - confirmDestructive: Destructive action confirmation
 * - confirmWithText: Text validation confirmation
 * - isOpen: Current dialog open state
 * - close: Method to programmatically close dialog
 * 
 * @example
 * ```tsx
 * const {
 *   confirm,
 *   confirmDestructive,
 *   confirmWithText,
 *   isOpen,
 *   close
 * }: UseConfirmDialogReturn = useConfirmDialog();
 * ```
 */
export type { UseConfirmDialogReturn } from './types';

/**
 * UseConfirmationReturn - Stateful confirmation hook interface
 * 
 * Interface for the useConfirmation hook return value, providing controlled
 * state management for confirmation dialogs with custom configuration.
 * 
 * Key Properties:
 * - isOpen: Dialog open state
 * - confirmationData: Current dialog configuration
 * - openConfirmation: Method to open dialog with configuration
 * - closeConfirmation: Method to close dialog
 * - handleConfirm: Confirmation handler
 * - handleCancel: Cancellation handler
 * - setLoading: Loading state control
 * - setDisabled: Disabled state control
 * 
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   confirmationData,
 *   openConfirmation,
 *   closeConfirmation,
 *   handleConfirm,
 *   handleCancel
 * }: UseConfirmationReturn = useConfirmation();
 * ```
 */
export type { UseConfirmationReturn } from './types';

/**
 * Configuration and Utility Types
 * 
 * Specialized type definitions for confirmation dialog configuration,
 * behavior options, and integration with the broader application.
 */

/**
 * ConfirmDialogVariant - Visual variant options
 * 
 * Union type defining available visual variants for confirmation dialogs,
 * each optimized for different types of user actions and operations.
 * 
 * Variants:
 * - 'default': Standard confirmation styling
 * - 'warning': Warning-level action styling (yellow/amber)
 * - 'danger': Destructive action styling (red)
 * - 'info': Informational confirmation styling (blue)
 * - 'success': Positive action styling (green)
 * 
 * @example
 * ```tsx
 * const variant: ConfirmDialogVariant = 'danger';
 * <ConfirmDialog variant={variant} destructive={true} />
 * ```
 */
export type { ConfirmDialogVariant } from './types';

/**
 * ConfirmDialogSize - Size configuration options
 * 
 * Union type defining size options for confirmation dialogs with responsive
 * behavior and mobile-optimized dimensions.
 * 
 * Sizes:
 * - 'sm': Small dialog (300px max width)
 * - 'md': Medium dialog (400px max width) - default
 * - 'lg': Large dialog (500px max width)
 * - 'xl': Extra large dialog (600px max width)
 * - 'full': Full screen on mobile, large on desktop
 * 
 * @example
 * ```tsx
 * const size: ConfirmDialogSize = 'lg';
 * <ConfirmDialog size={size} />
 * ```
 */
export type { ConfirmDialogSize } from './types';

/**
 * ConfirmDialogCloseSource - Dialog closure tracking
 * 
 * Union type for tracking how a confirmation dialog was closed, useful
 * for analytics and user behavior analysis.
 * 
 * Sources:
 * - 'confirm': User clicked confirm button
 * - 'cancel': User clicked cancel button
 * - 'escape': User pressed escape key
 * - 'backdrop': User clicked outside dialog
 * - 'programmatic': Dialog closed via code
 * 
 * @example
 * ```tsx
 * const handleClose = (source: ConfirmDialogCloseSource) => {
 *   analytics.track('dialog_closed', { source });
 * };
 * ```
 */
export type { ConfirmDialogCloseSource } from './types';

/**
 * Advanced Configuration Types
 * 
 * Specialized interfaces for advanced confirmation dialog features and
 * integration with database service operations.
 */

/**
 * DestructiveActionConfig - Destructive action configuration
 * 
 * Interface for configuring destructive action confirmations with enhanced
 * safety measures and visual indicators.
 * 
 * Features:
 * - Enhanced visual styling for destructive actions
 * - Optional confirmation delays
 * - Text confirmation requirements
 * - Custom warning messages
 * - Accessibility enhancements for critical actions
 * 
 * @example
 * ```tsx
 * const destructiveConfig: DestructiveActionConfig = {
 *   requireDoubleConfirmation: true,
 *   confirmationDelay: 3000,
 *   warningText: 'This action will permanently delete all data',
 *   requireTextConfirmation: true,
 *   confirmationText: 'DELETE'
 * };
 * ```
 */
export type { DestructiveActionConfig } from './types';

/**
 * TextConfirmationConfig - Text validation configuration
 * 
 * Interface for configuring text-based confirmation requirements for
 * critical operations that require explicit user acknowledgment.
 * 
 * Features:
 * - Case-sensitive or insensitive matching
 * - Custom validation patterns
 * - Real-time validation feedback
 * - Custom error messages
 * - Accessibility support for screen readers
 * 
 * @example
 * ```tsx
 * const textConfig: TextConfirmationConfig = {
 *   requiredText: 'DELETE MY DATABASE',
 *   caseSensitive: false,
 *   placeholder: 'Type the text above to confirm',
 *   validationMessage: 'Text must match exactly',
 *   showValidationIcon: true
 * };
 * ```
 */
export type { TextConfirmationConfig } from './types';

/**
 * AsyncConfirmationConfig - Async operation configuration
 * 
 * Interface for configuring confirmation dialogs that handle asynchronous
 * operations with loading states and error handling.
 * 
 * Features:
 * - Loading state management
 * - Error handling and display
 * - Timeout configuration
 * - Progress indication
 * - Retry mechanisms
 * 
 * @example
 * ```tsx
 * const asyncConfig: AsyncConfirmationConfig = {
 *   showLoadingSpinner: true,
 *   loadingText: 'Deleting service...',
 *   timeout: 30000,
 *   onError: (error) => showErrorToast(error.message),
 *   enableRetry: true
 * };
 * ```
 */
export type { AsyncConfirmationConfig } from './types';

// =============================================================================
// UTILITY CONSTANTS AND CONFIGURATIONS
// =============================================================================

/**
 * Default Configuration Objects
 * 
 * Pre-configured objects providing sensible defaults for confirmation dialogs,
 * accessibility compliance, and responsive behavior. These defaults ensure
 * consistent behavior across the application while allowing customization.
 */

/**
 * DEFAULT_CONFIRM_DIALOG_CONFIG - Default confirmation dialog settings
 * 
 * Optimized default configuration for confirmation dialogs including
 * accessibility compliance, responsive behavior, and integration with
 * the DreamFactory design system.
 * 
 * Features:
 * - WCAG 2.1 AA accessibility compliance
 * - Mobile-first responsive design
 * - Consistent button styling and spacing
 * - Appropriate focus management
 * - Standard animation timing
 * 
 * @example
 * ```tsx
 * const customConfig = {
 *   ...DEFAULT_CONFIRM_DIALOG_CONFIG,
 *   variant: 'warning',
 *   size: 'lg'
 * };
 * ```
 */
export { DEFAULT_CONFIRM_DIALOG_CONFIG } from './types';

/**
 * DESTRUCTIVE_ACTION_DEFAULTS - Default destructive action settings
 * 
 * Default configuration for destructive action confirmations with enhanced
 * safety measures and visual indicators.
 * 
 * Features:
 * - Red/danger color scheme
 * - Enhanced confirmation requirements
 * - Longer confirmation delays
 * - Clear warning messaging
 * - Accessibility enhancements
 * 
 * @example
 * ```tsx
 * const destructiveConfig = {
 *   ...DESTRUCTIVE_ACTION_DEFAULTS,
 *   requireTextConfirmation: true
 * };
 * ```
 */
export { DESTRUCTIVE_ACTION_DEFAULTS } from './types';

/**
 * TEXT_CONFIRMATION_DEFAULTS - Default text confirmation settings
 * 
 * Default configuration for text-based confirmation dialogs with
 * validation and accessibility features.
 * 
 * Features:
 * - Case-insensitive matching by default
 * - Clear validation feedback
 * - Screen reader support
 * - Real-time validation
 * - Error state handling
 */
export { TEXT_CONFIRMATION_DEFAULTS } from './types';

// =============================================================================
// ENUMERATION CONSTANTS
// =============================================================================

/**
 * ConfirmDialogVariants - Variant enumeration object
 * 
 * Enumeration object for confirmation dialog variants with type-safe access
 * and IntelliSense support in IDEs.
 * 
 * @example
 * ```tsx
 * <ConfirmDialog variant={ConfirmDialogVariants.DANGER} />
 * ```
 */
export { ConfirmDialogVariants } from './types';

/**
 * ConfirmDialogSizes - Size enumeration object
 * 
 * Enumeration object for confirmation dialog sizes with responsive
 * behavior and accessibility considerations.
 * 
 * @example
 * ```tsx
 * <ConfirmDialog size={ConfirmDialogSizes.LG} />
 * ```
 */
export { ConfirmDialogSizes } from './types';

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Module Version and Compatibility Information
 * 
 * Version information and compatibility metadata for the confirm dialog component
 * system, supporting version checking and migration assistance.
 */

/**
 * CONFIRM_DIALOG_VERSION - Component version string
 * 
 * Semantic version string for the confirm dialog component system, useful for
 * debugging, compatibility checking, and migration planning.
 */
export const CONFIRM_DIALOG_VERSION = '1.0.0' as const;

/**
 * CONFIRM_DIALOG_COMPATIBILITY - Framework compatibility information
 * 
 * Compatibility metadata including supported React, Next.js, and TypeScript
 * versions for integration planning and dependency management.
 */
export const CONFIRM_DIALOG_COMPATIBILITY = {
  react: '>=19.0.0',
  nextjs: '>=15.1.0',
  typescript: '>=5.8.0',
  tailwindcss: '>=4.1.0',
  parentDialog: '>=1.0.0'
} as const;

/**
 * CONFIRM_DIALOG_FEATURES - Feature flag enumeration
 * 
 * Feature availability flags for conditional functionality and
 * progressive enhancement support.
 */
export const CONFIRM_DIALOG_FEATURES = {
  PROMISE_BASED_WORKFLOWS: true,
  TEXT_CONFIRMATION: true,
  DESTRUCTIVE_ACTIONS: true,
  ASYNC_OPERATIONS: true,
  RESPONSIVE_DESIGN: true,
  ACCESSIBILITY: true,
  LOADING_STATES: true,
  ERROR_HANDLING: true
} as const;

// =============================================================================
// EXPORT SUMMARY
// =============================================================================

/**
 * Export Summary:
 * 
 * This barrel export provides comprehensive access to the confirm dialog component system:
 * 
 * **Components (1):**
 * - ConfirmDialog (main component with promise-based workflows)
 * 
 * **Hooks (2):**
 * - useConfirmDialog (imperative promise-based confirmation)
 * - useConfirmation (stateful confirmation management)
 * 
 * **Utility Functions (4):**
 * - confirmAction (basic confirmation)
 * - confirmDestructive (destructive action confirmation)
 * - confirmWithTextValidation (text validation confirmation)
 * - showConfirmDialog (generic confirmation with full options)
 * 
 * **Types (15+):**
 * - Core interfaces for component and data structures
 * - Hook return type interfaces
 * - Configuration and utility types
 * - Advanced feature configuration interfaces
 * 
 * **Constants (8):**
 * - Default configurations for various confirmation types
 * - Enumeration objects for type-safe option selection
 * - Version and compatibility metadata
 * - Feature availability flags
 * 
 * **Features Supported:**
 * ✅ React 19 promise-based architecture
 * ✅ Next.js 15.1 app router compatibility  
 * ✅ TypeScript 5.8+ complete type safety
 * ✅ WCAG 2.1 AA accessibility compliance
 * ✅ Mobile-first responsive design
 * ✅ Tailwind CSS 4.1+ integration
 * ✅ Promise-based async confirmation workflows
 * ✅ Destructive action protection and styling
 * ✅ Text confirmation for critical operations
 * ✅ Loading states for async operations
 * ✅ Error handling and retry mechanisms
 * ✅ Focus management and keyboard navigation
 * ✅ Screen reader and assistive technology support
 * ✅ Integration with database service operations
 * ✅ Backward compatibility with Angular dialog patterns where possible
 * 
 * This comprehensive export structure ensures clean imports while providing
 * access to all confirmation dialog functionality throughout the React/Next.js
 * application, with special focus on database service management and API
 * generation workflow integration.
 */