/**
 * Paywall Component Module Exports
 * 
 * Provides clean exports for the paywall component system, including the main
 * component, sub-components, types, and utilities. Enables tree-shaking
 * optimization and clean import patterns throughout the application.
 * 
 * @fileoverview Paywall component module exports
 * @version 1.0.0
 */

// Main component exports
export { default as Paywall } from './paywall';
export { CalendlyWidget, CalendlyErrorBoundary } from './paywall';

// Type exports
export type {
  PaywallProps,
  PaywallRef,
  PaywallVariant,
  PaywallLayout,
  CalendlyConfig,
  CalendlyState,
  CalendlyEvent,
  CalendlyScheduledEvent,
  CalendlyEventType,
  CalendlyMode,
  CalendlyPrefill,
  CalendlyUTM,
  CalendlyStyles,
  PaywallTranslationKeys,
  PaywallLoadingState,
  PaywallErrorState,
  PaywallResponsiveConfig,
  PaywallCompositionProps,
  PaywallHeaderProps,
  PaywallContentProps,
  PaywallWidgetProps,
  PaywallFooterProps,
  PaywallContactInfo,
  PaywallContentColumn,
  PaywallComponentProps,
  PaywallComponentRef,
  PaywallWithRef,
  PaywallTypesConfig
} from './types';

// Constants and utilities
export {
  PAYWALL_TRANSLATION_NAMESPACE,
  DEFAULT_PAYWALL_TRANSLATIONS,
  DEFAULT_RESPONSIVE_CONFIG,
  isPaywallVariant,
  isCalendlyMode,
  isCalendlyEventType
} from './types';

// Default export for convenience
export { default } from './paywall';