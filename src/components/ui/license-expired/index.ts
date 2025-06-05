/**
 * @fileoverview Main export file for the React LicenseExpired component system
 * 
 * This module provides centralized exports for the LicenseExpired component, TypeScript types,
 * and utility functions. Enables clean imports like 'import { LicenseExpired } from '@/components/ui/license-expired'
 * throughout the application while supporting tree-shaking for optimal bundle size.
 * 
 * Migration Context:
 * - Replaces Angular df-license-expired component with React 19 implementation
 * - Supports Next.js 15.1 app router patterns and server components
 * - Integrates with Tailwind CSS 4.1+ styling system
 * - Follows centralized UI component library structure
 * 
 * @version 1.0.0
 * @since DreamFactory Admin Interface v3.0.0 (React Migration)
 */

// =============================================================================
// COMPONENT EXPORTS
// =============================================================================

/**
 * Main LicenseExpired React component for displaying license expiration notifications
 * 
 * Features:
 * - License status validation and display
 * - Expiration warning messages with countdown
 * - Action buttons for license renewal/validation
 * - Theme-aware styling with Tailwind CSS
 * - Accessibility compliant with WCAG 2.1 AA standards
 * - Support for both light and dark modes
 * 
 * @example
 * ```tsx
 * import { LicenseExpired } from '@/components/ui/license-expired';
 * 
 * function App() {
 *   return (
 *     <LicenseExpired
 *       expirationDate={new Date('2024-12-31')}
 *       onRenew={() => handleLicenseRenewal()}
 *       variant="warning"
 *     />
 *   );
 * }
 * ```
 */
export { LicenseExpired } from './license-expired';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

/**
 * TypeScript type definitions for LicenseExpired component props
 * 
 * Provides comprehensive type safety for:
 * - Component properties and configuration options
 * - Event handlers and callback functions
 * - Styling variants and theme customization
 * - License status and expiration data structures
 * 
 * @example
 * ```tsx
 * import type { LicenseExpiredProps } from '@/components/ui/license-expired';
 * 
 * const config: LicenseExpiredProps = {
 *   expirationDate: new Date(),
 *   variant: 'error',
 *   showCountdown: true,
 *   onRenew: handleRenewal,
 *   onDismiss: handleDismiss
 * };
 * ```
 */
export type {
  LicenseExpiredProps,
  LicenseStatus,
  LicenseExpirationVariant,
  LicenseRenewalAction,
  LicenseValidationResult
} from './types';

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * License status enumeration for type-safe status checking
 * 
 * Provides standardized license states:
 * - VALID: License is active and valid
 * - EXPIRING: License expires within warning threshold
 * - EXPIRED: License has expired and requires renewal
 * - INVALID: License validation failed
 * - UNKNOWN: License status could not be determined
 * 
 * @example
 * ```tsx
 * import { LICENSE_STATUS } from '@/components/ui/license-expired';
 * 
 * if (licenseStatus === LICENSE_STATUS.EXPIRED) {
 *   // Handle expired license
 * }
 * ```
 */
export { LICENSE_STATUS } from './types';

/**
 * Theme variant constants for consistent styling
 * 
 * Supported variants:
 * - 'info': Blue theme for informational messages
 * - 'warning': Yellow/orange theme for warnings
 * - 'error': Red theme for critical errors
 * - 'success': Green theme for positive actions
 * 
 * @example
 * ```tsx
 * import { LICENSE_VARIANTS } from '@/components/ui/license-expired';
 * 
 * <LicenseExpired variant={LICENSE_VARIANTS.WARNING} />
 * ```
 */
export { LICENSE_VARIANTS } from './types';

// =============================================================================
// RE-EXPORTS FOR CONVENIENCE
// =============================================================================

/**
 * Default export for simplified imports
 * 
 * Allows both named and default imports for flexibility:
 * - Named: import { LicenseExpired } from '@/components/ui/license-expired'
 * - Default: import LicenseExpired from '@/components/ui/license-expired'
 * 
 * @default LicenseExpired
 */
export { LicenseExpired as default } from './license-expired';

// =============================================================================
// MODULE METADATA
// =============================================================================

/**
 * Component library metadata for development tools and documentation
 * 
 * Provides information for:
 * - Storybook integration and component explorer
 * - Development tools and component inspection
 * - Build-time optimization and tree-shaking
 * - Documentation generation systems
 */
export const COMPONENT_META = {
  name: 'LicenseExpired',
  category: 'UI/Notifications',
  version: '1.0.0',
  description: 'React component for displaying license expiration notifications and status',
  tags: ['license', 'notification', 'status', 'expiration', 'validation'],
  framework: 'React 19',
  styling: 'Tailwind CSS 4.1+',
  accessibility: 'WCAG 2.1 AA',
  dependencies: [
    'react@19.0.0',
    'next@15.1.0',
    'tailwindcss@4.1.0',
    '@headlessui/react@2.0.0'
  ]
} as const;

// =============================================================================
// COMPONENT COLLECTION
// =============================================================================

/**
 * Comprehensive export object for programmatic component access
 * 
 * Useful for:
 * - Dynamic component rendering systems
 * - Component registry and discovery
 * - Build-time analysis and optimization
 * - Testing utilities and component inspection
 * 
 * @example
 * ```tsx
 * import { LicenseExpiredComponents } from '@/components/ui/license-expired';
 * 
 * const { LicenseExpired, types, utilities } = LicenseExpiredComponents;
 * ```
 */
export const LicenseExpiredComponents = {
  // Core component
  LicenseExpired: require('./license-expired').LicenseExpired,
  
  // Type definitions (runtime accessible)
  types: {
    LICENSE_STATUS: require('./types').LICENSE_STATUS,
    LICENSE_VARIANTS: require('./types').LICENSE_VARIANTS,
  },
  
  // Component metadata
  meta: COMPONENT_META,
  
  // Version information
  version: '1.0.0',
  
  // Build information
  built: __filename,
} as const;

// =============================================================================
// DEVELOPMENT EXPORTS
// =============================================================================

/* istanbul ignore next - Development utilities */
if (process.env.NODE_ENV === 'development') {
  /**
   * Development-only exports for testing and debugging
   * 
   * These exports are automatically removed in production builds
   * to minimize bundle size and prevent access to internal utilities.
   */
  
  // Test utilities for component testing
  export { createLicenseExpiredTestProps } from './license-expired';
  
  // Mock data for development and testing
  export const MOCK_LICENSE_DATA = {
    expired: {
      expirationDate: new Date(Date.now() - 86400000), // Yesterday
      variant: 'error' as const,
      showCountdown: false,
    },
    expiring: {
      expirationDate: new Date(Date.now() + 604800000), // 7 days from now
      variant: 'warning' as const,
      showCountdown: true,
    },
    valid: {
      expirationDate: new Date(Date.now() + 31536000000), // 1 year from now
      variant: 'success' as const,
      showCountdown: false,
    },
  } as const;
  
  // Development component info
  export const DEV_INFO = {
    originalAngularComponent: 'df-license-expired',
    migrationDate: '2024-01-15',
    migrationNotes: [
      'Converted from Angular reactive forms to React Hook Form',
      'Replaced Angular Material with Headless UI + Tailwind CSS',
      'Added React 19 concurrent features support',
      'Implemented Next.js 15.1 app router compatibility',
    ],
  } as const;
}