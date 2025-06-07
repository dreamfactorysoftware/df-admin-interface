/**
 * LicenseExpired Component System - Main Export File
 * 
 * Centralizes all license expiration notice exports for the DreamFactory Admin Interface
 * React 19/Next.js 15.1 migration from Angular df-license-expired component.
 * 
 * This barrel export provides clean imports for:
 * - LicenseExpired component (license expiration notice display)
 * - License status type definitions and interfaces
 * - License action utilities and configuration
 * - Accessibility and WCAG 2.1 AA compliance utilities
 * 
 * Features:
 * - WCAG 2.1 AA compliant license notice component
 * - TypeScript 5.8+ type safety throughout
 * - Tailwind CSS 4.1+ design system integration
 * - Comprehensive internationalization support
 * - Multiple display variants (warning, expired, grace, renewal, suspended)
 * - Configurable action buttons with async support
 * - Keyboard navigation and screen reader accessibility
 * - Responsive design with mobile-first approach
 * - Dark/light theme support with system preference detection
 * 
 * @example
 * ```tsx
 * // Import the primary LicenseExpired component
 * import { LicenseExpired } from '@/components/ui/license-expired';
 * 
 * // Import specific types and utilities
 * import { type LicenseExpiredProps, type LicenseInfo } from '@/components/ui/license-expired';
 * 
 * // Import action utilities
 * import { createLicenseAction, LICENSE_STATES } from '@/components/ui/license-expired';
 * ```
 * 
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 5.2 - COMPONENT DETAILS
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

// =============================================================================
// PRIMARY LICENSE EXPIRED COMPONENT EXPORTS
// =============================================================================

/**
 * Main LicenseExpired component - Primary export for license expiration notices
 * 
 * Replaces Angular df-license-expired component with comprehensive React 19 
 * implementation featuring:
 * - WCAG 2.1 AA accessibility compliance with proper ARIA support
 * - Multi-variant display for different license states (warning, expired, grace, etc.)
 * - Internationalization support maintaining Angular Transloco translation keys
 * - Dark/light theme support with system preference detection
 * - Responsive design with mobile-first approach
 * - Configurable action buttons with loading states
 * - Keyboard navigation and screen reader announcements
 * - Dismissible behavior with customizable persistence
 * - Auto-dismiss functionality with configurable timing
 * - Rich license information display with countdown timers
 */
export { 
  LicenseExpired as default,
  LicenseExpired,
} from './license-expired';

/**
 * LicenseExpired component prop interfaces and types
 * Provides comprehensive TypeScript support for all license expiration configurations
 */
export type { 
  LicenseExpiredProps,
  LicenseExpiredVariantProps,
} from './types';

// =============================================================================
// LICENSE INFORMATION AND STATE TYPES
// =============================================================================

/**
 * License information and state management types
 * 
 * Provides structured interfaces for:
 * - License plan information and status tracking
 * - Expiration date management and countdown calculations
 * - Grace period handling and feature restrictions
 * - Support contact information and renewal URLs
 * - Status change events and notifications
 */
export type {
  LicenseInfo,
  LicenseStatusChangeEvent,
  LicenseExpirationConfig,
} from './types';

/**
 * License status and variant type definitions
 * Enables type-safe license state management throughout the application
 */
export type {
  LicenseExpiredVariant,
  LicenseExpiredSize,
  LicenseExpiredTheme,
} from './types';

// =============================================================================
// LICENSE ACTION CONFIGURATION EXPORTS
// =============================================================================

/**
 * License action configuration and button management
 * 
 * Provides interfaces for:
 * - Action button configuration with type-safe styling
 * - Click handlers for license management workflows
 * - Loading states for async renewal and contact operations
 * - ARIA labeling for enhanced accessibility
 * - Icon integration with Lucide React icons
 */
export type {
  LicenseAction,
  LicenseExpiredContent,
} from './types';

// =============================================================================
// ACCESSIBILITY AND RESPONSIVE DESIGN TYPES
// =============================================================================

/**
 * Enhanced accessibility and responsive design configurations
 * 
 * Supports WCAG 2.1 AA compliance with:
 * - Screen reader announcement customization
 * - Urgency level communication for assistive technologies
 * - Keyboard navigation and focus management
 * - Responsive breakpoint behavior
 * - Reduced motion preferences compliance
 * - Custom accessibility text overrides
 */
export type {
  LicenseExpiredAccessibilityProps,
  LicenseExpiredResponsiveProps,
  LicenseExpiredAnimationProps,
} from './types';

// =============================================================================
// COMPONENT STATE AND CONTEXT TYPES
// =============================================================================

/**
 * Component state management and context interfaces
 * 
 * Provides internal state structures for:
 * - Theme resolution and system preference detection
 * - Component mount/dismiss lifecycle management
 * - Countdown timer state and automation
 * - Focus management and keyboard navigation
 * - Context sharing between nested components
 */
export type {
  LicenseExpiredState,
  LicenseExpiredContext,
  UseLicenseExpiredReturn,
} from './types';

// =============================================================================
// UTILITY TYPE EXPORTS
// =============================================================================

/**
 * Utility types for external component composition
 * Enables type-safe integration with other UI components
 */
export type {
  LicenseExpiredPropsKeys,
  LicenseExpiredVariantKeys,
  LicenseExpiredSizeKeys,
  LicenseExpiredThemeKeys,
  LicenseExpiredDefaultProps,
} from './types';

// =============================================================================
// LICENSE STATE CONSTANTS AND UTILITIES
// =============================================================================

/**
 * License state constants for consistent status management
 * Provides standardized license status values and thresholds
 */
export const LICENSE_STATES = {
  ACTIVE: 'active',
  EXPIRING: 'expiring', 
  EXPIRED: 'expired',
  SUSPENDED: 'suspended',
  GRACE: 'grace',
} as const;

/**
 * License expiration variant mapping
 * Maps license states to appropriate visual variants
 */
export const LICENSE_VARIANT_MAP = {
  [LICENSE_STATES.ACTIVE]: 'renewal',
  [LICENSE_STATES.EXPIRING]: 'warning',
  [LICENSE_STATES.EXPIRED]: 'expired',
  [LICENSE_STATES.SUSPENDED]: 'suspended',
  [LICENSE_STATES.GRACE]: 'grace',
} as const;

/**
 * Default license expiration thresholds
 * Configurable warning and critical notification periods
 */
export const DEFAULT_LICENSE_THRESHOLDS = {
  WARNING_DAYS: 30,      // Show warning 30 days before expiration
  CRITICAL_DAYS: 7,      // Show critical warning 7 days before expiration
  GRACE_PERIOD_DAYS: 14, // Default grace period length
  REFRESH_INTERVAL: 60,  // Check license status every 60 minutes
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Creates a standardized license action configuration
 * Provides type-safe action button creation with accessibility defaults
 * 
 * @param config - Action configuration options
 * @returns Fully configured LicenseAction object
 * 
 * @example
 * ```tsx
 * const renewAction = createLicenseAction({
 *   id: 'renew-license',
 *   label: 'Renew License',
 *   type: 'primary',
 *   onClick: () => window.open('/renew', '_blank'),
 *   icon: <CreditCard className="w-4 h-4" />,
 * });
 * ```
 */
export const createLicenseAction = (config: Omit<LicenseAction, 'ariaLabel'> & { 
  ariaLabel?: string 
}): LicenseAction => ({
  ariaLabel: `${config.label} - License management action`,
  ...config,
});

/**
 * Calculates days remaining until license expiration
 * Provides consistent date calculation logic across components
 * 
 * @param expirationDate - License expiration date
 * @returns Number of days remaining (negative if expired)
 * 
 * @example
 * ```tsx
 * const daysRemaining = calculateDaysRemaining(new Date('2024-12-31'));
 * const isExpired = daysRemaining < 0;
 * ```
 */
export const calculateDaysRemaining = (expirationDate: Date): number => {
  const now = new Date();
  const timeDiff = expirationDate.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Determines appropriate license variant based on days remaining
 * Provides automatic variant selection logic
 * 
 * @param daysRemaining - Number of days until expiration
 * @param thresholds - Custom threshold configuration (optional)
 * @returns Appropriate LicenseExpiredVariant
 * 
 * @example
 * ```tsx
 * const variant = getLicenseVariant(5); // Returns 'expired' if less than 0, 'warning' if less than 30
 * ```
 */
export const getLicenseVariant = (
  daysRemaining: number,
  thresholds = DEFAULT_LICENSE_THRESHOLDS
): LicenseExpiredVariant => {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= thresholds.CRITICAL_DAYS) return 'warning';
  if (daysRemaining <= thresholds.WARNING_DAYS) return 'warning';
  return 'renewal';
};

/**
 * Formats time remaining text for display
 * Provides internationalization-friendly time formatting
 * 
 * @param daysRemaining - Number of days until expiration
 * @returns Human-readable time remaining text
 * 
 * @example
 * ```tsx
 * const timeText = formatTimeRemaining(5); // "5 days remaining"
 * const expiredText = formatTimeRemaining(-3); // "Expired 3 days ago"
 * ```
 */
export const formatTimeRemaining = (daysRemaining: number): string => {
  if (daysRemaining < 0) {
    const daysExpired = Math.abs(daysRemaining);
    return daysExpired === 1 
      ? `Expired ${daysExpired} day ago`
      : `Expired ${daysExpired} days ago`;
  }
  
  if (daysRemaining === 0) return 'Expires today';
  if (daysRemaining === 1) return '1 day remaining';
  
  return `${daysRemaining} days remaining`;
};

/**
 * Generates ARIA description for license status
 * Provides comprehensive screen reader announcements
 * 
 * @param licenseInfo - License information object
 * @returns ARIA-appropriate description text
 */
export const generateAriaDescription = (licenseInfo: LicenseInfo): string => {
  const daysRemaining = calculateDaysRemaining(licenseInfo.expirationDate);
  const timeText = formatTimeRemaining(daysRemaining);
  
  return `License Status: ${licenseInfo.status}. Plan: ${licenseInfo.planName}. ${timeText}.`;
};

// =============================================================================
// COMPONENT COLLECTION EXPORT
// =============================================================================

/**
 * Complete license expired component collection for bulk imports
 * Useful for component libraries and documentation systems
 * 
 * @example
 * ```tsx
 * import { LicenseExpiredComponents } from '@/components/ui/license-expired';
 * 
 * // Access all components through the collection
 * const { LicenseExpired } = LicenseExpiredComponents;
 * ```
 */
export const LicenseExpiredComponents = {
  LicenseExpired,
} as const;

/**
 * License utilities collection for bulk imports
 * Provides access to all utility functions and constants
 * 
 * @example
 * ```tsx
 * import { LicenseExpiredUtils } from '@/components/ui/license-expired';
 * 
 * // Access utilities through the collection
 * const daysLeft = LicenseExpiredUtils.calculateDaysRemaining(expirationDate);
 * const variant = LicenseExpiredUtils.getLicenseVariant(daysLeft);
 * ```
 */
export const LicenseExpiredUtils = {
  createLicenseAction,
  calculateDaysRemaining,
  getLicenseVariant,
  formatTimeRemaining,
  generateAriaDescription,
  LICENSE_STATES,
  LICENSE_VARIANT_MAP,
  DEFAULT_LICENSE_THRESHOLDS,
} as const;

// =============================================================================
// TYPE COLLECTION EXPORTS
// =============================================================================

/**
 * Complete type collection for license expired system
 * Consolidates all TypeScript interfaces and types for easy import
 */
export interface LicenseExpiredSystemTypes {
  LicenseExpiredProps: LicenseExpiredProps;
  LicenseInfo: LicenseInfo;
  LicenseAction: LicenseAction;
  LicenseExpiredContent: LicenseExpiredContent;
  LicenseExpiredVariantProps: LicenseExpiredVariantProps;
  LicenseExpiredState: LicenseExpiredState;
  LicenseExpiredContext: LicenseExpiredContext;
  LicenseStatusChangeEvent: LicenseStatusChangeEvent;
  LicenseExpirationConfig: LicenseExpirationConfig;
}

/**
 * License variant type union for dynamic component creation
 * Useful for configuration-driven license notice rendering
 */
export type LicenseVariant = 'warning' | 'expired' | 'grace' | 'renewal' | 'suspended';

/**
 * License size type union for dynamic sizing
 */
export type LicenseSize = 'compact' | 'default' | 'expanded';

/**
 * License theme type union for theme management
 */
export type LicenseTheme = 'light' | 'dark' | 'system';

/**
 * License position type union for layout control
 */
export type LicensePosition = 'center' | 'top' | 'bottom' | 'banner';

// =============================================================================
// ACCESSIBILITY CONSTANTS
// =============================================================================

/**
 * WCAG 2.1 AA compliance constants for license expired system
 * Provides reference values for accessibility validation
 */
export const ACCESSIBILITY_CONSTANTS = {
  /**
   * Minimum touch target size per WCAG guidelines
   */
  MIN_TOUCH_TARGET: {
    width: 44,
    height: 44,
  },
  
  /**
   * Minimum contrast ratios for AA compliance
   */
  CONTRAST_RATIOS: {
    normalText: 4.5,
    uiComponents: 3.0,
    enhancedText: 7.0, // AAA level
  },
  
  /**
   * Focus ring specifications
   */
  FOCUS_RING: {
    width: 2,
    offset: 2,
    borderRadius: 4,
  },
  
  /**
   * Animation and transition constants
   */
  TIMING: {
    transition: 200, // milliseconds
    announcement: 1000, // milliseconds for screen reader announcements
    autoDissmiss: 10000, // default auto-dismiss time
    countdownUpdate: 1000, // countdown timer update interval
  },
  
  /**
   * ARIA live region politeness levels
   */
  LIVE_REGIONS: {
    polite: 'polite',
    assertive: 'assertive',
    off: 'off',
  },
  
  /**
   * Urgency level mappings for screen readers
   */
  URGENCY_LEVELS: {
    low: 'polite',
    medium: 'polite',
    high: 'assertive',
    critical: 'assertive',
  },
} as const;

/**
 * Default license expired configuration for consistent application defaults
 */
export const DEFAULT_LICENSE_EXPIRED_CONFIG = {
  variant: 'expired' as LicenseVariant,
  size: 'default' as LicenseSize,
  theme: 'system' as LicenseTheme,
  position: 'center' as LicensePosition,
  dismissible: false,
  showCloseButton: false,
  autoDissmissAfter: undefined, // No auto-dismiss by default
  respectReducedMotion: true,
  urgencyLevel: 'high',
  announceTimeRemaining: true,
} as const;

/**
 * Common license action presets for quick implementation
 * Provides standard action configurations for common use cases
 */
export const COMMON_LICENSE_ACTIONS = {
  /**
   * Renewal action preset
   */
  RENEW: {
    id: 'renew-license',
    label: 'Renew License',
    type: 'primary' as const,
    ariaLabel: 'Renew DreamFactory license - opens renewal page',
  },
  
  /**
   * Contact support action preset
   */
  CONTACT_SUPPORT: {
    id: 'contact-support',
    label: 'Contact Support',
    type: 'secondary' as const,
    ariaLabel: 'Contact DreamFactory support - opens support page',
  },
  
  /**
   * View details action preset
   */
  VIEW_DETAILS: {
    id: 'view-details',
    label: 'View Details',
    type: 'outline' as const,
    ariaLabel: 'View license details - shows detailed license information',
  },
  
  /**
   * Dismiss action preset
   */
  DISMISS: {
    id: 'dismiss-notice',
    label: 'Dismiss',
    type: 'ghost' as const,
    ariaLabel: 'Dismiss license notice - hides this notification',
  },
} as const;