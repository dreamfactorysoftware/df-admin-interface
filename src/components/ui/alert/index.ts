/**
 * Alert Component System - Main Export File
 * 
 * Centralized exports for React 19 Alert compound component system replacing Angular
 * df-alert and df-error components. Enables clean imports like 'import { Alert } from 
 * '@/components/ui/alert' throughout the application while supporting tree-shaking
 * for optimal bundle size.
 * 
 * Features:
 * - React 19 compound component pattern (Alert.Icon, Alert.Content, Alert.Dismiss, Alert.Actions)
 * - TypeScript 5.8+ type definitions for props and variants
 * - Support for both df-alert and df-error use cases in unified system
 * - WCAG 2.1 AA accessibility compliance
 * - Heroicons integration per technology stack requirements
 * - Tailwind CSS 4.1+ styling with utility-first approach
 * - Tree-shaking support with named exports
 * 
 * @fileoverview Main export file for Alert component system
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Export main Alert compound component and subcomponents
 * Replaces Angular @Component with React compound pattern
 */
export {
  Alert,
  AlertHelpers,
  createAlert,
  useAlertContext,
} from './alert';

/**
 * Export Alert component as default for flexible import patterns
 * Supports both named and default imports:
 * - import { Alert } from '@/components/ui/alert'
 * - import Alert from '@/components/ui/alert'
 */
export { default } from './alert';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * Export all TypeScript type definitions for Alert components
 * Enables type-safe usage with TypeScript 5.8+ support
 */
export type {
  // Core Alert types
  AlertType,
  AlertVariant,
  AlertPosition,
  AlertSize,
  
  // Component props interfaces
  AlertProps,
  AlertIconProps,
  AlertContentProps,
  AlertDismissProps,
  AlertActionsProps,
  AlertContainerProps,
  
  // Configuration interfaces
  AlertResponsiveConfig,
  AlertAccessibilityConfig,
  AlertThemeConfig,
  AlertValidationState,
  AlertEventHandlers,
  AlertCompoundComponent,
} from './types';

// =============================================================================
// CONFIGURATION EXPORTS
// =============================================================================

/**
 * Export default configurations and constants
 * Provides consistent behavior across application
 */
export {
  ALERT_DEFAULTS,
  ALERT_TYPE_CONFIGS,
} from './types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Export utility functions and styling helpers
 * Enables customization and programmatic alert creation
 */
export {
  alertVariants,
  getAlertClasses,
  getAlertIcon,
} from './alert';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * Re-export specific component types for direct usage
 * Maintains compatibility with df-alert and df-error patterns
 */
export type {
  AlertType as DFAlertType,
  AlertProps as DFAlertProps,
  AlertProps as DFErrorProps,
} from './types';

/**
 * Legacy compatibility exports for migration from Angular
 * Maintains naming patterns during transition period
 */
export const DFAlert = Alert;
export const DFError = Alert;

// =============================================================================
// COMPOSED EXPORTS FOR COMMON PATTERNS
// =============================================================================

/**
 * Export commonly used alert configurations
 * Simplifies creation of standard alert patterns
 */
export const AlertVariants = {
  Success: (props: Partial<AlertProps> = {}) => AlertHelpers.success('', props),
  Error: (props: Partial<AlertProps> = {}) => AlertHelpers.error('', props),
  Warning: (props: Partial<AlertProps> = {}) => AlertHelpers.warning('', props),
  Info: (props: Partial<AlertProps> = {}) => AlertHelpers.info('', props),
  ValidationError: AlertHelpers.validationError,
  Banner: AlertHelpers.banner,
} as const;

/**
 * Export alert types for runtime checks
 * Enables type validation and filtering
 */
export const ALERT_TYPES = ['success', 'error', 'warning', 'info'] as const;
export const ALERT_VARIANTS = ['filled', 'outlined', 'soft', 'banner'] as const;
export const ALERT_SIZES = ['sm', 'md', 'lg'] as const;
export const ALERT_POSITIONS = ['inline', 'floating', 'sticky', 'toast'] as const;

/**
 * Type guard functions for runtime validation
 * Enables safe type checking in dynamic scenarios
 */
export const isAlertType = (value: unknown): value is AlertType => {
  return typeof value === 'string' && ALERT_TYPES.includes(value as AlertType);
};

export const isAlertVariant = (value: unknown): value is AlertVariant => {
  return typeof value === 'string' && ALERT_VARIANTS.includes(value as AlertVariant);
};

export const isAlertSize = (value: unknown): value is AlertSize => {
  return typeof value === 'string' && ALERT_SIZES.includes(value as AlertSize);
};

export const isAlertPosition = (value: unknown): value is AlertPosition => {
  return typeof value === 'string' && ALERT_POSITIONS.includes(value as AlertPosition);
};

// =============================================================================
// ACCESSIBILITY EXPORTS
// =============================================================================

/**
 * Export accessibility utilities and constants
 * Ensures WCAG 2.1 AA compliance across implementations
 */
export const ALERT_ARIA_LABELS = {
  success: 'Success alert',
  error: 'Error alert',
  warning: 'Warning alert',
  info: 'Information alert',
} as const;

export const ALERT_SCREEN_READER_MESSAGES = {
  dismissed: 'Alert dismissed',
  autoDismissing: 'Alert will automatically dismiss',
  requiresAction: 'Alert requires user action',
} as const;

/**
 * Accessibility helper functions
 * Provides consistent ARIA attributes and announcements
 */
export const AlertAccessibility = {
  getAriaLabel: (type: AlertType, title?: string) => 
    title ? `${ALERT_ARIA_LABELS[type]}: ${title}` : ALERT_ARIA_LABELS[type],
  
  getAnnouncementText: (type: AlertType, message: string) =>
    `${type} alert: ${message}`,
  
  shouldAnnounce: (type: AlertType, priority: string = 'medium') =>
    type === 'error' || priority === 'high',
} as const;

// =============================================================================
// MIGRATION HELPERS
// =============================================================================

/**
 * Migration utilities for Angular to React transition
 * Helps map Angular df-alert patterns to React equivalents
 */
export const MigrationHelpers = {
  /**
   * Convert Angular df-alert props to React Alert props
   * Maintains functional compatibility during migration
   */
  migrateFromDFAlert: (angularProps: Record<string, any>): Partial<AlertProps> => {
    const {
      type = 'info',
      message = '',
      title = '',
      dismissible = false,
      autoClose = false,
      autoCloseDelay = 5000,
      ...rest
    } = angularProps;

    return {
      type: isAlertType(type) ? type : 'info',
      description: message,
      title,
      dismissible,
      autoDismiss: autoClose ? autoCloseDelay : undefined,
      ...rest,
    };
  },

  /**
   * Convert Angular df-error props to React Alert props
   * Specifically handles error validation scenarios
   */
  migrateFromDFError: (angularProps: Record<string, any>): Partial<AlertProps> => {
    const {
      field = '',
      message = '',
      fieldId = '',
      ...rest
    } = angularProps;

    return {
      type: 'error',
      title: field ? `${field} Error` : 'Validation Error',
      description: message,
      fieldId,
      dismissible: true,
      variant: 'soft',
      size: 'sm',
      priority: 'high',
      announce: true,
      ...rest,
    };
  },
} as const;

// =============================================================================
// PERFORMANCE EXPORTS
// =============================================================================

/**
 * Performance optimization utilities
 * Enables efficient rendering and memory management
 */
export const AlertPerformance = {
  /**
   * Debounce alert creation to prevent spam
   * Useful for rapid validation or network error scenarios
   */
  debounceAlert: (fn: () => void, delay: number = 300) => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(fn, delay);
    };
  },

  /**
   * Throttle alert announcements for accessibility
   * Prevents overwhelming screen readers with rapid updates
   */
  throttleAnnouncement: (fn: () => void, limit: number = 1000) => {
    let inThrottle: boolean;
    return () => {
      if (!inThrottle) {
        fn();
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
} as const;

// =============================================================================
// TESTING EXPORTS
// =============================================================================

/**
 * Testing utilities for component verification
 * Supports Vitest and Testing Library patterns
 */
export const AlertTestUtils = {
  /**
   * Generate test props for different alert scenarios
   * Enables consistent testing across components
   */
  getTestProps: (overrides: Partial<AlertProps> = {}): AlertProps => ({
    type: 'info',
    description: 'Test alert message',
    'data-testid': 'alert-component',
    alertId: 'test-alert-id',
    ...overrides,
  }),

  /**
   * Mock alert event handlers for testing
   * Provides jest-compatible mock functions
   */
  getMockHandlers: () => ({
    onDismiss: jest?.fn?.() || (() => {}),
    onBeforeDismiss: jest?.fn?.(() => true) || (() => true),
    onClick: jest?.fn?.() || (() => {}),
  }),

  /**
   * Generate accessibility test scenarios
   * Covers WCAG 2.1 AA compliance testing
   */
  getA11yTestCases: () => [
    { type: 'success' as AlertType, 'aria-live': 'polite' as const },
    { type: 'error' as AlertType, 'aria-live': 'assertive' as const },
    { type: 'warning' as AlertType, 'aria-live': 'polite' as const },
    { type: 'info' as AlertType, 'aria-live': 'polite' as const },
  ],
} as const;

// =============================================================================
// COMPREHENSIVE TYPE EXPORT
// =============================================================================

/**
 * Comprehensive type definition for the complete Alert system
 * Enables full TypeScript support across all use cases
 */
export interface AlertComponentSystem {
  Alert: typeof Alert;
  AlertHelpers: typeof AlertHelpers;
  createAlert: typeof createAlert;
  useAlertContext: typeof useAlertContext;
  AlertVariants: typeof AlertVariants;
  MigrationHelpers: typeof MigrationHelpers;
  AlertAccessibility: typeof AlertAccessibility;
  AlertPerformance: typeof AlertPerformance;
  AlertTestUtils: typeof AlertTestUtils;
}

// =============================================================================
// VERSION INFORMATION
// =============================================================================

/**
 * Component version and metadata
 * Enables version tracking and compatibility checks
 */
export const ALERT_COMPONENT_VERSION = '1.0.0';
export const ALERT_COMPONENT_COMPAT = {
  react: '>=19.0.0',
  typescript: '>=5.8.0',
  nextjs: '>=15.1.0',
  tailwind: '>=4.1.0',
} as const;

/**
 * Feature flags for optional functionality
 * Enables progressive feature adoption
 */
export const ALERT_FEATURES = {
  animations: true,
  autoAnnounce: true,
  autoDismiss: true,
  compoundComponents: true,
  keyboardNavigation: true,
  themeing: true,
  validation: true,
  accessibility: true,
} as const;

// =============================================================================
// DOCUMENTATION EXPORT
// =============================================================================

/**
 * Component documentation and usage examples
 * Provides inline documentation for development
 */
export const AlertDocumentation = {
  description: 'Comprehensive Alert component system replacing Angular df-alert and df-error with React 19 compound pattern and WCAG 2.1 AA accessibility compliance.',
  
  examples: {
    basic: `<Alert type="info" description="Basic information alert" />`,
    withTitle: `<Alert type="success" title="Success!" description="Operation completed successfully" />`,
    dismissible: `<Alert type="warning" description="Warning message" dismissible onDismiss={() => {}} />`,
    compound: `
      <Alert type="error" dismissible>
        <Alert.Icon />
        <Alert.Content title="Error" description="Something went wrong" />
        <Alert.Actions actions={<Button>Retry</Button>} />
        <Alert.Dismiss onDismiss={() => {}} />
      </Alert>
    `,
    validation: `{AlertHelpers.validationError('Email', 'Invalid email format', 'email-field')}`,
  },
  
  migration: {
    dfAlert: 'Replace <df-alert> with <Alert> component',
    dfError: 'Replace <df-error> with Alert.validationError() helper',
    angularService: 'Replace AlertService with AlertHelpers utilities',
  },
} as const;