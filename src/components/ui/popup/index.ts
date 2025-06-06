/**
 * @fileoverview Popup Component System - Main Export File
 * 
 * Provides clean barrel exports for the React 19/Next.js 15.1 popup component system,
 * replacing Angular shared components with modern hook-based patterns and context management.
 * 
 * This module centralizes all popup-related exports including the main Popup component,
 * usePopup hook for programmatic management, PopupProvider for application-wide state,
 * and comprehensive TypeScript interfaces for type safety across the DreamFactory admin interface.
 * 
 * @version 1.0.0
 * @since React 19.0.0 / Next.js 15.1.0
 */

// =============================================================================
// MAIN COMPONENT EXPORTS
// =============================================================================

/**
 * Primary Popup Component - React implementation replacing Angular DfPopupComponent
 * 
 * Provides WCAG 2.1 AA compliant popup dialogs with authentication workflow support,
 * focus management, and configurable appearance for password security notices and
 * general purpose dialog requirements.
 */
export { Popup } from './popup';

/**
 * Default export for easier importing in Next.js App Router pages and components
 * 
 * @example
 * ```tsx
 * import Popup from '@/components/ui/popup';
 * // or
 * import { Popup } from '@/components/ui/popup';
 * ```
 */
export { default } from './popup';

// =============================================================================
// CONTEXT AND PROVIDER EXPORTS
// =============================================================================

/**
 * PopupProvider - Context component for application-wide popup state management
 * 
 * Should be placed high in the component tree (typically in app layout) to ensure
 * popup state is available throughout the React application. Replaces Angular
 * service injection patterns with modern React context.
 * 
 * @example
 * ```tsx
 * function RootLayout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <PopupProvider config={{ maxStack: 3, closeOnBackdropClick: true }}>
 *       {children}
 *     </PopupProvider>
 *   );
 * }
 * ```
 */
export { PopupProvider } from './popup-service';

// =============================================================================
// HOOK EXPORTS FOR PROGRAMMATIC CONTROL
// =============================================================================

/**
 * Primary popup management hook - Replaces Angular PopupOverlayService injection
 * 
 * Provides programmatic popup control with promise-based workflows, automatic cleanup,
 * and service-like API patterns familiar to Angular developers while leveraging
 * React patterns for state management and lifecycle handling.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const popup = usePopup();
 *   
 *   const showPasswordNotice = async () => {
 *     try {
 *       const result = await popup.open(Popup, {
 *         data: { 
 *           title: 'Password Security Notice',
 *           message: 'Please update your password for better security.'
 *         },
 *         closeOnBackdropClick: false
 *       }).afterClosed();
 *       
 *       if (result === 'confirm') {
 *         // Handle password update workflow
 *       }
 *     } catch (error) {
 *       console.error('Popup error:', error);
 *     }
 *   };
 *   
 *   return <button onClick={showPasswordNotice}>Check Password</button>;
 * }
 * ```
 */
export { usePopup } from './popup-service';

/**
 * Advanced popup queue management hook
 * 
 * Provides utilities for managing multiple popups in sequence, useful for
 * complex workflows like database connection setup with multiple confirmation steps.
 * 
 * @example
 * ```tsx
 * function DatabaseSetupComponent() {
 *   const { addToQueue, queueLength, isProcessing } = usePopupQueue();
 *   
 *   const runSetupSequence = () => {
 *     addToQueue(ConfirmConnectionPopup, { data: { step: 1 } });
 *     addToQueue(ValidateSchemaPopup, { data: { step: 2 } });
 *     addToQueue(GenerateAPIPopup, { data: { step: 3 } });
 *   };
 * }
 * ```
 */
export { usePopupQueue } from './popup-service';

/**
 * Configuration injection hook - Similar to Angular dependency injection patterns
 * 
 * Provides access to global popup configuration, enabling components to read
 * application-wide popup settings without prop drilling.
 * 
 * @example
 * ```tsx
 * function CustomPopupComponent() {
 *   const config = usePopupConfig();
 *   const maxStack = config.maxStack; // Access global settings
 *   
 *   return <div>Max popups allowed: {maxStack}</div>;
 * }
 * ```
 */
export { usePopupConfig } from './popup-service';

// =============================================================================
// TYPESCRIPT INTERFACE EXPORTS
// =============================================================================

/**
 * Core popup configuration interface for component props and programmatic usage
 * 
 * Defines the shape of popup configuration objects used throughout the application
 * for consistent typing and IntelliSense support across all popup implementations.
 */
export type { PopupConfig, PopupProps } from './types';

/**
 * Popup variant and size type definitions for consistent theming
 * 
 * Provides type safety for popup appearance configuration, ensuring only valid
 * variants and sizes are used across the application.
 */
export type { 
  PopupVariant, 
  PopupSize, 
  PopupButtonType 
} from './types';

/**
 * Action and workflow configuration types
 * 
 * Defines interfaces for popup actions, authentication workflows, and button
 * configurations supporting complex interaction patterns.
 */
export type { 
  PopupAction,
  AuthWorkflowCallbacks,
  AuthRedirectReason,
  LogoutReason,
  PopupResult
} from './types';

/**
 * Accessibility and animation configuration types
 * 
 * Provides WCAG 2.1 AA compliance configuration options and animation
 * settings for enhanced user experience and accessibility.
 */
export type {
  PopupAccessibilityConfig,
  PopupAnimationConfig,
  PopupThemeConfig,
  PopupI18nConfig
} from './types';

/**
 * State management and context types
 * 
 * Defines interfaces for popup state management, context values, and provider
 * configuration for comprehensive type safety in React context usage.
 */
export type {
  PopupState,
  PopupInstance,
  PopupInstanceState,
  PopupContextType,
  UsePopupReturn,
  PopupProviderProps as PopupProviderPropsType
} from './types';

/**
 * Service-layer type exports with aliases to avoid conflicts
 * 
 * Exports popup service configuration types with appropriate naming to
 * distinguish from component-level configuration types.
 */
export type {
  PopupConfig as ServicePopupConfig,
  PopupPosition,
  PopupSize as ServicePopupSize,
  PopupOptions,
  PopupRef,
  PopupProviderProps as ServiceProviderProps
} from './popup-service';

// =============================================================================
// UTILITY FUNCTIONS AND CONFIGURATION HELPERS
// =============================================================================

/**
 * Type guard functions for runtime type checking
 * 
 * Provides utility functions to validate popup configuration at runtime,
 * ensuring type safety when working with dynamic popup configurations.
 */
export { isPopupVariant, isPopupSize } from './types';

/**
 * Default configuration constants
 * 
 * Exports predefined configuration objects for consistent popup behavior
 * across the application, supporting rapid development and standardization.
 */
export { 
  DEFAULT_POPUP_CONFIG, 
  DEFAULT_GLOBAL_SETTINGS,
  POPUP_SIZE_CONFIG,
  POPUP_Z_INDEX
} from './types';

/**
 * Service configuration defaults for programmatic usage
 * 
 * Provides default configuration objects for popup service integration,
 * supporting Angular-style service patterns in React context.
 */
export { 
  defaultConfig as DEFAULT_SERVICE_CONFIG,
  defaultOptions as DEFAULT_SERVICE_OPTIONS 
} from './popup-service';

// =============================================================================
// CONVENIENCE PRESET CONFIGURATIONS
// =============================================================================

/**
 * Popup configuration presets for common use cases
 * 
 * Pre-configured popup settings for typical DreamFactory admin interface scenarios
 * including authentication notices, confirmations, and error dialogs.
 */
export const POPUP_PRESETS = {
  /**
   * Password security notice configuration
   * Used for authentication workflow password update prompts
   */
  passwordSecurity: {
    variant: 'authentication' as const,
    size: 'md' as const,
    showRemindMeLater: true,
    dismissOnClickOutside: false,
    title: 'Password Security Notice',
    accessibility: {
      role: 'alertdialog' as const,
      trapFocus: true,
      modal: true,
    },
    animation: {
      preset: 'fade' as const,
      duration: 300,
    },
  },

  /**
   * Confirmation dialog configuration
   * Used for destructive actions and important decisions
   */
  confirmation: {
    variant: 'confirmation' as const,
    size: 'sm' as const,
    showRemindMeLater: false,
    dismissOnClickOutside: false,
    showCloseButton: false,
    accessibility: {
      role: 'alertdialog' as const,
      trapFocus: true,
      modal: true,
    },
    animation: {
      preset: 'scale' as const,
      duration: 200,
    },
  },

  /**
   * Error notification configuration
   * Used for displaying error messages and recovery options
   */
  error: {
    variant: 'error' as const,
    size: 'md' as const,
    showRemindMeLater: false,
    dismissOnClickOutside: true,
    accessibility: {
      role: 'alertdialog' as const,
      announceOnOpen: true,
      modal: false,
    },
    animation: {
      preset: 'slide' as const,
      slideDirection: 'down' as const,
      duration: 250,
    },
  },

  /**
   * Success notification configuration
   * Used for positive feedback and completion confirmations
   */
  success: {
    variant: 'success' as const,
    size: 'sm' as const,
    showRemindMeLater: false,
    dismissOnClickOutside: true,
    autoCloseTimeout: 5000,
    accessibility: {
      role: 'dialog' as const,
      announceOnOpen: true,
      modal: false,
    },
    animation: {
      preset: 'fade' as const,
      duration: 200,
    },
  },

  /**
   * Information dialog configuration
   * Used for general information display and help content
   */
  info: {
    variant: 'info' as const,
    size: 'lg' as const,
    showRemindMeLater: false,
    dismissOnClickOutside: true,
    accessibility: {
      role: 'dialog' as const,
      trapFocus: true,
      modal: true,
    },
    animation: {
      preset: 'fade' as const,
      duration: 300,
    },
  },

  /**
   * Warning notification configuration
   * Used for cautionary messages and non-destructive alerts
   */
  warning: {
    variant: 'warning' as const,
    size: 'md' as const,
    showRemindMeLater: false,
    dismissOnClickOutside: true,
    accessibility: {
      role: 'alertdialog' as const,
      announceOnOpen: true,
      modal: false,
    },
    animation: {
      preset: 'slide' as const,
      slideDirection: 'up' as const,
      duration: 250,
    },
  },
} as const;

// =============================================================================
// UTILITY FUNCTIONS FOR POPUP CREATION
// =============================================================================

/**
 * Factory function for creating popup configurations with presets
 * 
 * Simplifies popup creation by providing preset-based configuration with
 * override capabilities for specific customization requirements.
 * 
 * @param preset - The preset configuration to use as base
 * @param overrides - Custom configuration to merge with preset
 * @returns Complete popup configuration object
 * 
 * @example
 * ```tsx
 * const config = createPopupConfig('passwordSecurity', {
 *   title: 'Custom Password Notice',
 *   size: 'lg'
 * });
 * ```
 */
export const createPopupConfig = (
  preset: keyof typeof POPUP_PRESETS,
  overrides: Partial<PopupConfig> = {}
): PopupConfig => {
  const baseConfig = POPUP_PRESETS[preset];
  return {
    ...DEFAULT_POPUP_CONFIG,
    ...baseConfig,
    ...overrides,
    accessibility: {
      ...DEFAULT_POPUP_CONFIG.accessibility,
      ...baseConfig.accessibility,
      ...overrides.accessibility,
    },
    animation: {
      ...DEFAULT_POPUP_CONFIG.animation,
      ...baseConfig.animation,
      ...overrides.animation,
    },
  };
};

/**
 * Helper function to create popup actions with consistent patterns
 * 
 * Provides a standardized way to create popup action configurations
 * with proper TypeScript typing and accessibility considerations.
 * 
 * @param label - The button label text
 * @param onClick - Click handler function
 * @param options - Additional action configuration
 * @returns Configured popup action object
 * 
 * @example
 * ```tsx
 * const confirmAction = createPopupAction('Confirm', handleConfirm, {
 *   variant: 'primary',
 *   type: 'confirm'
 * });
 * ```
 */
export const createPopupAction = (
  label: string,
  onClick: () => void,
  options: Partial<PopupAction> = {}
): PopupAction => ({
  label,
  onClick,
  type: 'custom',
  variant: 'secondary',
  disabled: false,
  closesPopup: true,
  loading: false,
  ...options,
});

// =============================================================================
// VERSION AND METADATA
// =============================================================================

/**
 * Package metadata for version tracking and debugging
 */
export const POPUP_COMPONENT_INFO = {
  version: '1.0.0',
  framework: 'React 19.0.0',
  platform: 'Next.js 15.1+',
  typescript: '5.8+',
  styling: 'Tailwind CSS 4.1+',
  accessibility: 'WCAG 2.1 AA',
  replaces: 'Angular DfPopupComponent',
} as const;