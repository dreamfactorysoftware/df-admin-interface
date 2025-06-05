/**
 * Popup Component System Exports
 * 
 * This barrel export file provides centralized access to all popup-related components,
 * hooks, types, and utilities for the React/Next.js application. Replaces Angular
 * PopupOverlayService patterns with modern React context and hook-based architecture.
 * 
 * @module PopupSystem
 * @description Centralized popup system exports supporting password security notices,
 * authentication workflows, and general purpose modal dialogs with WCAG 2.1 AA compliance.
 * 
 * @example
 * ```tsx
 * // Import popup component and hook
 * import { Popup, usePopup } from '@/components/ui/popup'
 * 
 * // Import specific types
 * import type { PopupConfig, PopupProps } from '@/components/ui/popup'
 * 
 * // Use in component
 * function MyComponent() {
 *   const { showPopup, hidePopup } = usePopup()
 *   
 *   const handleShowNotice = () => {
 *     showPopup({
 *       message: 'Password security notice',
 *       showRemindLaterButton: true,
 *       onConfirm: () => router.push('/profile/password')
 *     })
 *   }
 *   
 *   return <button onClick={handleShowNotice}>Show Notice</button>
 * }
 * ```
 */

// Main popup component exports
export { default, default as Popup } from './popup'
export type { PopupProps } from './popup'

// Popup service hook and provider exports
export { 
  usePopup,
  PopupProvider,
  createPopupContext
} from './popup-service'
export type { 
  PopupContextType,
  PopupQueueItem,
  PopupServiceConfig
} from './popup-service'

// Type definitions and interfaces
export type {
  PopupConfig,
  PopupMessage,
  PopupButtonConfig,
  PopupCallbacks,
  PopupVariant,
  PopupAnimation,
  PopupAccessibilityConfig,
  PopupThemeConfig,
  PopupInternationalizationConfig
} from './types'

// Utility functions and helpers
export {
  createPopupConfig,
  validatePopupConfig,
  getDefaultPopupConfig,
  mergePopupConfigs
} from './types'

// Re-export common patterns for convenience
export type {
  // Authentication workflow types
  AuthenticationPopupConfig,
  PasswordSecurityNoticeConfig,
  
  // Generic popup usage patterns
  ConfirmationPopupConfig,
  NotificationPopupConfig,
  
  // Component composition types
  PopupWithProviderProps,
  PopupRenderProps
} from './types'

/**
 * Popup system configuration constants
 * 
 * Provides default configurations and theme tokens for consistent
 * popup behavior across the application.
 */
export const POPUP_DEFAULTS = {
  /**
   * Default popup variant for general purpose usage
   */
  variant: 'modal' as const,
  
  /**
   * Default animation configuration using Tailwind CSS transitions
   */
  animation: {
    enter: 'fade-in',
    exit: 'fade-out',
    duration: 300
  } as const,
  
  /**
   * WCAG 2.1 AA compliant accessibility defaults
   */
  accessibility: {
    role: 'dialog',
    'aria-modal': true,
    focusTrap: true,
    restoreFocus: true
  } as const,
  
  /**
   * Responsive breakpoint behavior
   */
  responsive: {
    mobile: 'full-screen',
    tablet: 'modal',
    desktop: 'modal'
  } as const
} as const

/**
 * Popup system feature flags and capabilities
 * 
 * Defines available features and their implementation status
 * for progressive enhancement and backward compatibility.
 */
export const POPUP_FEATURES = {
  /**
   * Authentication workflow integration
   */
  authenticationIntegration: true,
  
  /**
   * Internationalization support with react-i18next
   */
  i18nSupport: true,
  
  /**
   * Dark mode and theme switching
   */
  themeSupport: true,
  
  /**
   * Mobile-first responsive design
   */
  responsiveDesign: true,
  
  /**
   * Keyboard navigation and accessibility
   */
  keyboardNavigation: true,
  
  /**
   * Screen reader announcements
   */
  screenReaderSupport: true,
  
  /**
   * Animation and transition support
   */
  animations: true,
  
  /**
   * Promise-based async workflows
   */
  asyncWorkflows: true
} as const

/**
 * Legacy compatibility exports
 * 
 * Provides backward-compatible naming for easier migration
 * from Angular popup patterns while encouraging modern usage.
 * 
 * @deprecated Use the primary exports above for new implementations
 */
export {
  // Legacy naming for Angular migration compatibility
  usePopup as usePopupService,
  PopupProvider as PopupOverlayProvider,
  
  // Legacy configuration patterns
  type PopupConfig as PopupOverlayConfig
}

/**
 * Development and debugging utilities
 * 
 * Only available in development mode for debugging and testing.
 * These exports are tree-shaken in production builds.
 */
if (process.env.NODE_ENV === 'development') {
  // Debug utilities for popup system testing
  export { 
    debugPopupState,
    logPopupEvent,
    validatePopupAccess
  } from './popup-service'
}