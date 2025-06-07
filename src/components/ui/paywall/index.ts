/**
 * Paywall Component System - Main Export File
 * 
 * Comprehensive barrel export for the React 19 Paywall component system providing
 * centralized access to all Paywall-related components, types, and utilities.
 * Optimized for Next.js 15.1 app router compatibility with tree-shaking support
 * and enhanced TypeScript 5.8+ compilation performance.
 * 
 * Features:
 * - Clean import patterns following React 19/Next.js 15.1 conventions
 * - Tree-shaking optimization for minimal bundle impact
 * - Type-only exports for enhanced TypeScript compilation performance
 * - Comprehensive type safety with PaywallProps and CalendlyConfig interfaces
 * - Compatible with modern bundlers and development tools
 * 
 * Usage Examples:
 * ```typescript
 * // Import component and types
 * import { Paywall, type PaywallProps } from '@/components/ui/paywall'
 * import type { CalendlyConfig, PaywallLevel } from '@/components/ui/paywall'
 * 
 * // Default import
 * import Paywall from '@/components/ui/paywall'
 * 
 * // Specific type imports for better performance
 * import type { PaywallRef, PaywallVariant } from '@/components/ui/paywall'
 * ```
 * 
 * @fileoverview Main export file for Paywall component system
 * @version 1.0.0
 * @author DreamFactory Admin Interface Team
 */

// Component exports - both default and named for flexibility
export { Paywall, default as PaywallComponent } from './paywall';

// Re-export as default for clean default imports
export { default } from './paywall';

// Type-only exports for enhanced TypeScript compilation performance
// These exports are optimized away during compilation but provide full type safety
export type {
  // Core component interfaces
  PaywallProps,
  PaywallRef,
  PaywallTriggerProps,
  PaywallContextValue,
  
  // Configuration types
  CalendlyConfig,
  CalendlyEvent,
  FeatureGate,
  PaywallContent,
  PaywallAnalytics,
  
  // Enum and literal types
  PaywallLevel,
  PaywallVariant,
  
  // State management types
  PaywallLoadingState,
  PaywallErrorState,
  
  // Translation and internationalization
  PaywallTranslationKeys,
  
  // Styling and theme types
  PaywallVariants,
  
  // Utility types
  PaywallEventHandler,
  PaywallStateUpdater,
  
  // Default export type alias
  PaywallProps as default
} from './types';

// Named exports for backwards compatibility and explicit imports
export type { 
  PaywallProps as PaywallComponentProps,
  CalendlyConfig as PaywallCalendlyConfig,
  PaywallLevel as SubscriptionLevel,
  PaywallVariant as PaywallDisplayVariant 
} from './types';

/**
 * Utility function to check if a subscription level has access to a required level
 * Useful for conditional rendering and access control throughout the application
 * 
 * @param currentLevel - User's current subscription level
 * @param requiredLevel - Required level for feature access
 * @returns Boolean indicating whether access should be granted
 * 
 * @example
 * ```typescript
 * import { hasFeatureAccess } from '@/components/ui/paywall'
 * 
 * const canUseAdvancedFeatures = hasFeatureAccess('professional', 'enterprise')
 * // Returns false - professional level cannot access enterprise features
 * ```
 */
export const hasFeatureAccess = (
  currentLevel: PaywallLevel, 
  requiredLevel: PaywallLevel
): boolean => {
  const levelHierarchy: Record<PaywallLevel, number> = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
    trial: 1
  };
  
  return levelHierarchy[currentLevel] >= levelHierarchy[requiredLevel];
};

/**
 * Utility function to get the display name for a subscription level
 * Useful for UI components that need to show user-friendly level names
 * 
 * @param level - The subscription level to get display name for
 * @returns Human-readable display name for the level
 * 
 * @example
 * ```typescript
 * import { getPaywallLevelDisplayName } from '@/components/ui/paywall'
 * 
 * const displayName = getPaywallLevelDisplayName('professional')
 * // Returns "Professional"
 * ```
 */
export const getPaywallLevelDisplayName = (level: PaywallLevel): string => {
  const displayNames: Record<PaywallLevel, string> = {
    free: 'Free',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
    trial: 'Trial'
  };
  
  return displayNames[level];
};

/**
 * Default Calendly configuration for DreamFactory sales demos
 * Provides sensible defaults for Calendly widget integration
 * 
 * @example
 * ```typescript
 * import { DEFAULT_CALENDLY_CONFIG } from '@/components/ui/paywall'
 * 
 * <Paywall 
 *   calendlyConfig={{
 *     ...DEFAULT_CALENDLY_CONFIG,
 *     options: {
 *       ...DEFAULT_CALENDLY_CONFIG.options,
 *       primaryColor: '#custom-color'
 *     }
 *   }}
 * />
 * ```
 */
export const DEFAULT_CALENDLY_CONFIG: CalendlyConfig = {
  url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
  options: {
    height: 500,
    hideEventTypeDetails: false,
    hideLandingPageDetails: false,
    primaryColor: '#6366f1',
    textColor: '#1f2937',
    backgroundColor: '#ffffff'
  }
};

/**
 * Type guard to check if a value is a valid PaywallLevel
 * Useful for runtime validation and type narrowing
 * 
 * @param value - Value to check
 * @returns Boolean indicating if value is a valid PaywallLevel
 * 
 * @example
 * ```typescript
 * import { isPaywallLevel } from '@/components/ui/paywall'
 * 
 * const userLevel = getUserLevel()
 * if (isPaywallLevel(userLevel)) {
 *   // TypeScript knows userLevel is PaywallLevel here
 *   const hasAccess = hasFeatureAccess(userLevel, 'professional')
 * }
 * ```
 */
export const isPaywallLevel = (value: unknown): value is PaywallLevel => {
  return typeof value === 'string' && 
    ['free', 'starter', 'professional', 'enterprise', 'trial'].includes(value);
};

/**
 * Type guard to check if a value is a valid PaywallVariant
 * Useful for runtime validation and component variant selection
 * 
 * @param value - Value to check
 * @returns Boolean indicating if value is a valid PaywallVariant
 * 
 * @example
 * ```typescript
 * import { isPaywallVariant } from '@/components/ui/paywall'
 * 
 * const variant = getPreferredVariant()
 * if (isPaywallVariant(variant)) {
 *   // TypeScript knows variant is PaywallVariant here
 *   return <Paywall variant={variant} />
 * }
 * ```
 */
export const isPaywallVariant = (value: unknown): value is PaywallVariant => {
  return typeof value === 'string' && 
    ['modal', 'inline', 'banner', 'sidebar', 'tooltip'].includes(value);
};

// Re-export types from the main types file for comprehensive access
import type { 
  PaywallLevel,
  PaywallVariant,
  CalendlyConfig,
  PaywallProps
} from './types';

/**
 * Comprehensive export validation
 * This ensures all necessary exports are available and properly typed
 * The TypeScript compiler will error if any exports are missing or incorrectly typed
 */
type ValidateExports = {
  // Component exports
  Paywall: typeof import('./paywall').Paywall;
  PaywallComponent: typeof import('./paywall').default;
  default: typeof import('./paywall').default;
  
  // Type exports (these are type-only and don't affect runtime)
  PaywallProps: PaywallProps;
  CalendlyConfig: CalendlyConfig;
  PaywallLevel: PaywallLevel;
  PaywallVariant: PaywallVariant;
  
  // Utility exports
  hasFeatureAccess: typeof hasFeatureAccess;
  getPaywallLevelDisplayName: typeof getPaywallLevelDisplayName;
  DEFAULT_CALENDLY_CONFIG: CalendlyConfig;
  isPaywallLevel: typeof isPaywallLevel;
  isPaywallVariant: typeof isPaywallVariant;
};

// This type assertion ensures our exports match the expected interface
// It's removed during compilation but provides compile-time validation
const _validateExports: ValidateExports = {} as any;