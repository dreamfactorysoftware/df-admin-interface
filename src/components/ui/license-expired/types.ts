/**
 * LicenseExpired Component Type Definitions
 * 
 * TypeScript interfaces for the LicenseExpired component system following
 * React 19/Next.js 15.1 patterns with WCAG 2.1 AA accessibility compliance.
 * 
 * @fileoverview Type definitions for accessible, theme-aware LicenseExpired component
 * @version 1.0.0
 */

import { type ReactNode, type ComponentPropsWithoutRef } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { 
  type BaseComponentProps,
  type AccessibilityProps,
  type ThemeProps,
  type ResponsiveProps,
  type AnimationProps,
  type InteractionProps,
  type FocusProps
} from '@/types/ui';

/**
 * Theme variant types for LicenseExpired component
 * Supports Tailwind CSS dark mode implementation with system preference detection
 */
export type LicenseExpiredTheme = 'light' | 'dark' | 'system';

/**
 * Visual variant types for different license expiration states
 * WCAG 2.1 AA compliant with proper contrast ratios
 */
export type LicenseExpiredVariant = 
  | 'warning'     // License expiring soon (amber/yellow theme)
  | 'expired'     // License has expired (red/error theme)
  | 'grace'       // Grace period active (orange theme)
  | 'renewal'     // Renewal available (blue/info theme)
  | 'suspended';  // Service suspended (gray/neutral theme)

/**
 * Size variants for different layout contexts
 * Maintains minimum 44px touch targets for accessibility
 */
export type LicenseExpiredSize = 
  | 'compact'     // Minimal space, sidebar or banner
  | 'default'     // Standard modal or page section
  | 'expanded';   // Full-page or prominent display

/**
 * Action button configuration for license-related actions
 */
export interface LicenseAction {
  /** Action identifier */
  id: string;
  /** Button text label */
  label: string;
  /** Action type affecting button styling */
  type: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Click handler for the action */
  onClick: () => void;
  /** Disable the action button */
  disabled?: boolean;
  /** Loading state for async actions */
  loading?: boolean;
  /** ARIA label for enhanced accessibility */
  ariaLabel?: string;
  /** Icon to display with the action */
  icon?: ReactNode;
}

/**
 * License information structure
 */
export interface LicenseInfo {
  /** License type/plan name */
  planName: string;
  /** Current license status */
  status: 'active' | 'expiring' | 'expired' | 'suspended' | 'grace';
  /** License expiration date */
  expirationDate: Date;
  /** Days remaining until expiration (negative if expired) */
  daysRemaining: number;
  /** Grace period end date if applicable */
  gracePeriodEnd?: Date;
  /** Features affected by license status */
  affectedFeatures?: string[];
  /** Support contact information */
  supportContact?: string;
  /** Renewal URL or contact */
  renewalUrl?: string;
}

/**
 * Responsive behavior configuration for license component
 */
export interface LicenseExpiredResponsiveProps extends ResponsiveProps {
  /** Stack layout on mobile devices */
  stackOnMobile?: boolean;
  /** Hide detailed information on small screens */
  hideDetailsOnMobile?: boolean;
  /** Compact action layout for mobile */
  compactActionsOnMobile?: boolean;
}

/**
 * Enhanced accessibility props for LicenseExpired component
 * Ensures WCAG 2.1 AA compliance with proper ARIA support
 */
export interface LicenseExpiredAccessibilityProps extends AccessibilityProps {
  /** Announce urgency level to screen readers */
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  /** Announce remaining time to screen readers */
  announceTimeRemaining?: boolean;
  /** Custom announcement text override */
  customAnnouncement?: string;
  /** Skip to action buttons shortcut */
  skipToActions?: boolean;
  /** Provide alternative text for visual elements */
  alternativeText?: string;
}

/**
 * Animation configuration for state transitions
 */
export interface LicenseExpiredAnimationProps extends AnimationProps {
  /** Animate countdown changes */
  animateCountdown?: boolean;
  /** Pulse animation for urgent states */
  pulseOnUrgent?: boolean;
  /** Fade in animation duration */
  fadeInDuration?: 'fast' | 'normal' | 'slow';
  /** Enable reduced motion compliance */
  respectReducedMotion?: boolean;
}

/**
 * Content customization options
 */
export interface LicenseExpiredContent {
  /** Primary heading text */
  title?: string;
  /** Detailed description */
  description?: string;
  /** Custom message based on license state */
  customMessage?: ReactNode;
  /** Show countdown timer */
  showCountdown?: boolean;
  /** Show affected features list */
  showAffectedFeatures?: boolean;
  /** Custom footer content */
  footer?: ReactNode;
}

/**
 * Complete props interface for LicenseExpired component
 * Combines all prop types with React 19 compatibility
 */
export interface LicenseExpiredProps 
  extends BaseComponentProps<HTMLDivElement>,
          LicenseExpiredAccessibilityProps,
          LicenseExpiredResponsiveProps,
          LicenseExpiredAnimationProps,
          Omit<InteractionProps, 'onClick'>,
          FocusProps {
  
  /** License information to display */
  licenseInfo: LicenseInfo;
  
  /** Visual variant based on license state */
  variant?: LicenseExpiredVariant;
  
  /** Component size variant */
  size?: LicenseExpiredSize;
  
  /** Theme preference (overrides system theme) */
  theme?: LicenseExpiredTheme;
  
  /** Available actions for license management */
  actions?: LicenseAction[];
  
  /** Content customization options */
  content?: LicenseExpiredContent;
  
  /** Enable dismissible behavior */
  dismissible?: boolean;
  
  /** Dismiss handler for dismissible component */
  onDismiss?: () => void;
  
  /** Custom className for Tailwind utility composition */
  className?: string;
  
  /** Additional container styling */
  containerClassName?: string;
  
  /** Header section styling */
  headerClassName?: string;
  
  /** Content section styling */
  contentClassName?: string;
  
  /** Actions section styling */
  actionsClassName?: string;
  
  /** Override default icon for the license state */
  customIcon?: ReactNode;
  
  /** Show close button for dismissible component */
  showCloseButton?: boolean;
  
  /** Position variant for overlay scenarios */
  position?: 'center' | 'top' | 'bottom' | 'banner';
  
  /** Z-index for overlay positioning */
  zIndex?: number;
  
  /** Enable backdrop for modal-like behavior */
  backdrop?: boolean;
  
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  
  /** Close on escape key */
  closeOnEscape?: boolean;
  
  /** Prevent interaction with background content */
  modal?: boolean;
  
  /** Auto-dismiss after specified time (in seconds) */
  autoDissmissAfter?: number;
  
  /** Callback when component mounts */
  onMount?: () => void;
  
  /** Callback when component unmounts */
  onUnmount?: () => void;
  
  /** Callback when license status changes */
  onStatusChange?: (status: LicenseInfo['status']) => void;
  
  /** Test identifier for automated testing */
  'data-testid'?: string;
}

/**
 * Variant props type for class-variance-authority integration
 * Enables dynamic Tailwind class composition
 */
export type LicenseExpiredVariantProps = VariantProps<any> & {
  variant?: LicenseExpiredVariant;
  size?: LicenseExpiredSize;
  theme?: LicenseExpiredTheme;
};

/**
 * Component state type for internal state management
 */
export interface LicenseExpiredState {
  /** Current theme resolved from system/preference */
  resolvedTheme: 'light' | 'dark';
  /** Component is mounted and ready */
  mounted: boolean;
  /** Component is in dismissed state */
  dismissed: boolean;
  /** Countdown timer is running */
  countdownActive: boolean;
  /** Current countdown value */
  countdownValue: number;
  /** Component is in focus state */
  focused: boolean;
}

/**
 * Context type for nested component communication
 */
export interface LicenseExpiredContext {
  /** Current component state */
  state: LicenseExpiredState;
  /** Update component state */
  setState: (updates: Partial<LicenseExpiredState>) => void;
  /** License information */
  licenseInfo: LicenseInfo;
  /** Resolved variant based on license status */
  resolvedVariant: LicenseExpiredVariant;
  /** Accessibility helpers */
  accessibility: {
    /** Generate ARIA description */
    getAriaDescription: () => string;
    /** Generate urgency announcement */
    getUrgencyAnnouncement: () => string;
    /** Focus first action button */
    focusFirstAction: () => void;
  };
}

/**
 * Hook return type for useLicenseExpired
 */
export interface UseLicenseExpiredReturn {
  /** Current component state */
  state: LicenseExpiredState;
  /** Actions to update state */
  actions: {
    dismiss: () => void;
    focus: () => void;
    blur: () => void;
    startCountdown: () => void;
    stopCountdown: () => void;
  };
  /** Computed values */
  computed: {
    isUrgent: boolean;
    isCritical: boolean;
    shouldShowActions: boolean;
    timeRemainingText: string;
    ariaDescription: string;
  };
}

/**
 * Configuration type for license expiration detection
 */
export interface LicenseExpirationConfig {
  /** Days before expiration to show warning */
  warningThreshold: number;
  /** Days before expiration to show critical warning */
  criticalThreshold: number;
  /** Grace period length in days */
  gracePeriodDays: number;
  /** Auto-refresh interval for license status (minutes) */
  refreshInterval: number;
  /** Enable browser notifications */
  browserNotifications: boolean;
}

/**
 * Type for license status change events
 */
export interface LicenseStatusChangeEvent {
  /** Previous license status */
  previousStatus: LicenseInfo['status'];
  /** New license status */
  currentStatus: LicenseInfo['status'];
  /** Days remaining until expiration */
  daysRemaining: number;
  /** Timestamp of the change */
  timestamp: Date;
  /** Whether this is an automatic status update */
  automatic: boolean;
}

/**
 * Export utility types for external consumption
 */
export type LicenseExpiredPropsKeys = keyof LicenseExpiredProps;
export type LicenseExpiredVariantKeys = keyof typeof LicenseExpiredVariant;
export type LicenseExpiredSizeKeys = keyof typeof LicenseExpiredSize;
export type LicenseExpiredThemeKeys = keyof typeof LicenseExpiredTheme;

/**
 * Default props type for component initialization
 */
export type LicenseExpiredDefaultProps = Required<Pick<
  LicenseExpiredProps,
  'variant' | 'size' | 'theme' | 'dismissible' | 'showCountdown' | 'respectReducedMotion'
>>;