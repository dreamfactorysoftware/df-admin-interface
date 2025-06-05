/**
 * @fileoverview Main export file for the Paywall component system
 * 
 * Provides centralized exports for the Paywall component, TypeScript type definitions,
 * and utility functions. Enables clean imports throughout the application following
 * React 19/Next.js 15.1 conventions with optimal tree-shaking support.
 * 
 * @example
 * ```tsx
 * // Named imports for tree-shaking optimization
 * import { Paywall, type PaywallProps } from '@/components/ui/paywall';
 * 
 * // Default import alternative
 * import Paywall from '@/components/ui/paywall';
 * 
 * // Type-only imports for enhanced TypeScript performance
 * import type { PaywallProps, CalendlyConfig } from '@/components/ui/paywall';
 * ```
 */

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/**
 * Main Paywall component - available as both named and default export
 * for maximum compatibility with different import patterns
 */
export { default as Paywall } from './paywall';
export { default } from './paywall';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * TypeScript interface definitions for the Paywall component system
 * Exported as type-only imports for enhanced compilation performance
 */
export type {
  PaywallProps,
  PaywallRef,
  CalendlyConfig,
} from './types';

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * Re-export all types and interfaces from the types module
 * Provides access to additional utility types that may be added in the future
 */
export type * from './types';