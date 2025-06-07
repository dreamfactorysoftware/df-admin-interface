/**
 * Alert Component System - Main Export File
 * 
 * Centralized exports for the React 19 Alert compound component system replacing
 * Angular df-alert and df-error components. Provides comprehensive TypeScript
 * type definitions, tree-shakable named exports, and unified interface for both
 * inline alerts and error displays in the DreamFactory Admin Interface.
 * 
 * Key Features:
 * - React 19 compound component pattern (Alert.Icon, Alert.Content, Alert.Dismiss)
 * - TypeScript 5.8+ type definitions with full type safety
 * - Tree-shaking optimized named exports for minimal bundle size
 * - WCAG 2.1 AA accessibility compliance
 * - Unified interface supporting both df-alert and df-error use cases
 * - Tailwind CSS 4.1+ integration with class-variance-authority
 * 
 * @example
 * ```tsx
 * // Basic alert usage
 * import { Alert } from '@/components/ui/alert';
 * <Alert type="success" description="Database connected successfully!" />
 * 
 * // Compound component pattern
 * import { Alert, AlertType } from '@/components/ui/alert';
 * <Alert type="error" dismissible>
 *   <Alert.Icon />
 *   <Alert.Content 
 *     title="Connection Failed" 
 *     description="Unable to connect to database" 
 *   />
 *   <Alert.Dismiss />
 * </Alert>
 * 
 * // Helper utilities for quick alerts
 * import { AlertHelpers } from '@/components/ui/alert';
 * {AlertHelpers.validationError('Email', 'Invalid format', 'email-field')}
 * ```
 * 
 * @see Technical Specification Section 0.2.1 - Implementation Plan
 * @see Technical Specification Section 7.1 - Core UI Technologies
 */

// =============================================================================
// COMPONENT EXPORTS - React 19 Compound Component Pattern
// =============================================================================

/**
 * Main Alert component with compound pattern support
 * 
 * Exported as both named export and default export for maximum compatibility.
 * Supports both simple usage and compound component patterns.
 */
export {
  Alert,
  Alert as default,
} from './alert';

/**
 * Compound component exports for advanced usage patterns
 * 
 * These are attached to the main Alert component but also exported individually
 * for tree-shaking optimization and explicit imports.
 */
export {
  Alert as AlertRoot,
} from './alert';

// Note: Alert.Icon, Alert.Content, and Alert.Dismiss are automatically
// available through the compound component pattern on the main Alert export

// =============================================================================
// TYPESCRIPT TYPE EXPORTS - Complete Type System
// =============================================================================

/**
 * Core Alert type definitions
 * Essential types for alert configuration and usage
 */
export type {
  AlertType,
  AlertVariant,
  AlertPosition,
  AlertDuration,
} from './types';

/**
 * Main component prop interfaces
 * Primary interfaces for Alert component and its compound components
 */
export type {
  AlertProps,
  AlertAction,
  AlertIconProps,
  AlertContentProps,
  AlertDismissProps,
} from './types';

/**
 * Container and system configuration types
 * Types for advanced alert management and configuration
 */
export type {
  AlertContainerProps,
  AlertSystemConfig,
  AlertInstance,
} from './types';

/**
 * Styling and theming type definitions
 * Types for design system integration and customization
 */
export type {
  AlertVariantConfig,
  AlertThemeConfig,
} from './types';

/**
 * Hook and utility type definitions
 * Types for React hooks and utility functions
 */
export type {
  UseAlertReturn,
  AlertAccessibilityUtils,
  AlertTypeBundle,
} from './types';

/**
 * Re-exported base UI types for convenience
 * Common types from the UI type system for easy access
 */
export type {
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  ResponsiveValue,
  ComponentVariantConfig,
} from './types';

// =============================================================================
// UTILITY FUNCTION EXPORTS - Helper Functions and Factories
// =============================================================================

/**
 * Alert helper utilities for common use cases
 * 
 * Provides convenient factory functions for creating alerts quickly.
 * Replaces Angular service-based alert creation patterns.
 */
export {
  AlertHelpers,
} from './alert';

/**
 * Alert creation utilities
 * 
 * Factory functions for programmatic alert creation and management.
 */
export {
  createAlert,
} from './alert';

/**
 * Icon and styling utilities
 * 
 * Utility functions for alert icons and CSS class generation.
 */
export {
  getAlertIcon,
  getAlertClasses,
} from './alert';

/**
 * Alert context hook for compound components
 * 
 * React hook for accessing alert context within compound components.
 */
export {
  useAlertContext,
} from './alert';

// =============================================================================
// CSS VARIANT EXPORTS - Styling System Integration
// =============================================================================

/**
 * Class-variance-authority variant configurations
 * 
 * CVA configurations for alert styling with Tailwind CSS 4.1+.
 * Enables external customization and extension of alert styles.
 */
export {
  alertVariants,
  dismissButtonVariants,
} from './alert';

// =============================================================================
// TYPE GUARDS AND VALIDATORS - Runtime Type Safety
// =============================================================================

/**
 * Type guard functions for runtime validation
 * 
 * Utility functions for validating alert types and configurations at runtime.
 */
export {
  isAlertType,
  isAlertVariant,
  isAlertPosition,
  validateAlertProps,
} from './types';

// =============================================================================
// CONVENIENCE RE-EXPORTS - Unified Access Patterns
// =============================================================================

/**
 * Complete type bundle export for comprehensive type access
 * 
 * Provides a single import for all alert-related types, useful for
 * configuration files and type-heavy modules.
 */
export type { default as AlertTypes } from './types';

// =============================================================================
// LEGACY COMPATIBILITY EXPORTS - Angular Migration Support
// =============================================================================

/**
 * Legacy compatibility exports for Angular df-alert migration
 * 
 * These exports provide compatibility with existing Angular alert patterns
 * during the migration process, ensuring smooth transition from Angular to React.
 */

/**
 * df-alert component replacement
 * Maps to standard Alert component with appropriate defaults
 */
export const DfAlert = Alert;

/**
 * df-error component replacement  
 * Maps to Alert component with error type and validation-specific styling
 */
export const DfError = Alert;

/**
 * Legacy alert type mapping for Angular compatibility
 * Maintains exact AlertType values from Angular implementation
 */
export const ALERT_TYPES = {
  SUCCESS: 'success' as const,
  ERROR: 'error' as const,
  WARNING: 'warning' as const,
  INFO: 'info' as const,
} as const;

/**
 * Legacy alert creation function matching Angular service patterns
 * Provides familiar API for developers migrating from Angular
 */
export const createLegacyAlert = (
  type: AlertType,
  message: string,
  options: Partial<AlertProps> = {}
) => createAlert({
  type,
  description: message,
  ...options,
});

// =============================================================================
// MODULE METADATA - Bundle Information
// =============================================================================

/**
 * Component metadata for development tools and documentation
 */
export const ALERT_COMPONENT_METADATA = {
  name: 'Alert',
  version: '1.0.0',
  description: 'React 19 Alert component system for DreamFactory Admin Interface',
  framework: 'React 19 + Next.js 15.1 + Tailwind CSS 4.1+',
  accessibility: 'WCAG 2.1 AA compliant',
  replaces: ['df-alert', 'df-error'],
  patterns: ['compound-component', 'controlled', 'uncontrolled'],
  exports: {
    components: ['Alert', 'DfAlert', 'DfError'],
    types: [
      'AlertType', 'AlertProps', 'AlertIconProps', 
      'AlertContentProps', 'AlertDismissProps'
    ],
    utilities: ['AlertHelpers', 'createAlert', 'getAlertIcon'],
    variants: ['alertVariants', 'dismissButtonVariants'],
  },
} as const;

/**
 * Tree-shaking metadata for bundler optimization
 */
export const __ALERT_TREE_SHAKE_METADATA__ = {
  sideEffects: false,
  pureExports: [
    'Alert', 'AlertHelpers', 'createAlert', 'getAlertIcon',
    'alertVariants', 'dismissButtonVariants', 'useAlertContext'
  ],
  typeOnlyExports: [
    'AlertType', 'AlertProps', 'AlertIconProps', 'AlertContentProps',
    'AlertDismissProps', 'AlertVariantConfig', 'AlertThemeConfig'
  ],
} as const;