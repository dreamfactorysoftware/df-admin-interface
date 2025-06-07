/**
 * LicenseExpired Component Types for DreamFactory Admin Interface
 * 
 * TypeScript 5.8+ type definitions providing full type safety for React component props
 * in the license expiration notification system. Supports theme variants, accessibility
 * compliance, and responsive design patterns per React 19 migration requirements.
 * 
 * Replaces Angular @Input decorators with modern React props pattern while maintaining
 * WCAG 2.1 AA compliance and Tailwind CSS integration.
 * 
 * @fileoverview License expiration UI component type definitions
 * @version 2.0.0
 * @since React 19 migration
 */

import { ReactNode, ComponentProps } from 'react';
import { VariantProps } from 'class-variance-authority';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  ResponsiveValue,
  ComponentState,
  ButtonComponent
} from '@/types/ui';

// ============================================================================
// CORE COMPONENT TYPES
// ============================================================================

/**
 * Theme variant types supporting Tailwind CSS dark mode implementation
 * per Section 7.1.2 styling specifications with WCAG 2.1 AA compliance
 */
export type LicenseThemeVariant = 'light' | 'dark' | 'system';

/**
 * License expiration severity levels affecting visual presentation
 * and user interaction patterns for progressive disclosure
 */
export type LicenseExpiredSeverity = 'warning' | 'critical' | 'blocked';

/**
 * License expiration context providing semantic meaning
 * for different licensing scenarios and user actions
 */
export type LicenseExpiredContext = 
  | 'trial-expired'
  | 'subscription-lapsed' 
  | 'feature-restricted'
  | 'enterprise-required'
  | 'maintenance-expired'
  | 'user-limit-exceeded';

/**
 * Display mode configuration for different UI presentation patterns
 * supporting responsive design with Tailwind CSS utilities
 */
export type LicenseDisplayMode = 
  | 'modal'        // Full overlay dialog for critical blocking
  | 'banner'       // Top-of-page notification bar
  | 'card'         // Inline card component for dashboard
  | 'tooltip'      // Contextual hover information
  | 'sidebar'      // Side panel for non-intrusive notifications
  | 'inline';      // Embedded content within forms/sections

/**
 * Action button configuration for license-related user actions
 * with accessibility and responsive design considerations
 */
export interface LicenseAction {
  /** Unique identifier for the action */
  id: string;
  
  /** Action label text displayed to users */
  label: string;
  
  /** Optional secondary description for complex actions */
  description?: string;
  
  /** Visual variant following component design system */
  variant?: ComponentVariant;
  
  /** Action priority affecting visual prominence */
  priority: 'primary' | 'secondary' | 'tertiary';
  
  /** Action handler function */
  onClick: () => void | Promise<void>;
  
  /** Loading state for async actions */
  loading?: boolean;
  
  /** Disabled state with optional reason */
  disabled?: boolean;
  disabledReason?: string;
  
  /** Icon component for visual enhancement */
  icon?: React.ComponentType<{ className?: string }>;
  
  /** External link indicator for navigation actions */
  external?: boolean;
  
  // WCAG 2.1 AA Accessibility props
  /** Accessible label for screen readers */
  'aria-label'?: string;
  
  /** ARIA description for complex actions */
  'aria-describedby'?: string;
  
  /** Screen reader announcement on action completion */
  announceOnComplete?: string;
}

/**
 * License information structure providing context
 * for expiration scenarios and user guidance
 */
export interface LicenseInfo {
  /** License type identifier */
  type: string;
  
  /** Human-readable license name */
  name: string;
  
  /** License expiration date */
  expirationDate?: Date | string;
  
  /** Days remaining until expiration (negative if expired) */
  daysRemaining?: number;
  
  /** Current license status */
  status: 'active' | 'warning' | 'expired' | 'suspended';
  
  /** Features affected by license status */
  affectedFeatures?: string[];
  
  /** User limits and current usage */
  userLimits?: {
    max: number;
    current: number;
    unit: 'users' | 'admins' | 'connections' | 'api-calls';
  };
  
  /** Renewal or upgrade information */
  renewalInfo?: {
    url?: string;
    contactEmail?: string;
    phoneNumber?: string;
    supportUrl?: string;
  };
}

// ============================================================================
// MAIN COMPONENT INTERFACE
// ============================================================================

/**
 * LicenseExpiredProps interface replacing Angular @Input decorators
 * with React props pattern per React 19 migration requirements.
 * 
 * Provides comprehensive type safety for license expiration notifications
 * with theme support, accessibility compliance, and responsive design.
 */
export interface LicenseExpiredProps extends BaseComponent {
  // ========================================================================
  // CORE CONFIGURATION
  // ========================================================================
  
  /**
   * Theme variant supporting Tailwind CSS dark mode implementation
   * per Section 7.1.2 styling specifications
   * @default 'system'
   */
  theme?: LicenseThemeVariant;
  
  /**
   * Severity level affecting visual presentation and user interaction
   * @default 'warning'
   */
  severity?: LicenseExpiredSeverity;
  
  /**
   * License context providing semantic meaning for the expiration
   * @default 'trial-expired'
   */
  context?: LicenseExpiredContext;
  
  /**
   * Display mode configuration for UI presentation pattern
   * @default 'modal'
   */
  displayMode?: LicenseDisplayMode;
  
  /**
   * License information object providing expiration context
   */
  licenseInfo?: LicenseInfo;
  
  // ========================================================================
  // CONTENT CONFIGURATION
  // ========================================================================
  
  /**
   * Primary title text for the license expiration notification
   * @default Auto-generated based on context and severity
   */
  title?: string;
  
  /**
   * Detailed message explaining the license expiration impact
   * @default Auto-generated based on license info and context
   */
  message?: string | ReactNode;
  
  /**
   * Additional help text or instructions for users
   */
  helpText?: string | ReactNode;
  
  /**
   * Custom content to render within the component
   */
  children?: ReactNode;
  
  /**
   * Action buttons for license-related user interactions
   * @default Auto-generated renewal/contact actions
   */
  actions?: LicenseAction[];
  
  /**
   * Whether to show automatic action suggestions
   * @default true
   */
  showSuggestedActions?: boolean;
  
  // ========================================================================
  // VISUAL CONFIGURATION
  // ========================================================================
  
  /**
   * Component size affecting spacing and typography
   * @default 'md'
   */
  size?: ComponentSize;
  
  /**
   * Visual variant for consistent design system integration
   * @default 'warning' for severity warning, 'error' for critical/blocked
   */
  variant?: ComponentVariant;
  
  /**
   * Whether to show an icon representing the license status
   * @default true
   */
  showIcon?: boolean;
  
  /**
   * Custom icon component to override default severity icon
   */
  customIcon?: React.ComponentType<{ className?: string }>;
  
  /**
   * Whether to animate the component entrance
   * @default true for modal/banner, false for card/inline
   */
  animated?: boolean;
  
  /**
   * Animation duration in milliseconds
   * @default 300
   */
  animationDuration?: number;
  
  // ========================================================================
  // RESPONSIVE DESIGN SUPPORT
  // ========================================================================
  
  /**
   * Responsive size configuration for different breakpoints
   * Supporting mobile, tablet, and desktop layouts per Tailwind CSS utilities
   */
  responsiveSize?: ResponsiveValue<ComponentSize>;
  
  /**
   * Responsive display mode for different screen sizes
   * Enables progressive enhancement and mobile-first design
   */
  responsiveMode?: ResponsiveValue<LicenseDisplayMode>;
  
  /**
   * Mobile-specific configuration overrides
   */
  mobileConfig?: {
    /** Whether to use fullscreen modal on mobile */
    fullscreen?: boolean;
    /** Mobile-specific action layout */
    stackActions?: boolean;
    /** Simplified content for small screens */
    compactContent?: boolean;
  };
  
  // ========================================================================
  // BEHAVIOR CONFIGURATION
  // ========================================================================
  
  /**
   * Whether the component can be dismissed by the user
   * @default true for banner/card, false for modal with critical severity
   */
  dismissible?: boolean;
  
  /**
   * Auto-dismiss configuration for non-critical notifications
   */
  autoDismiss?: {
    /** Enable automatic dismissal after timeout */
    enabled: boolean;
    /** Timeout in milliseconds */
    timeout: number;
    /** Whether to show countdown timer */
    showCountdown?: boolean;
  };
  
  /**
   * Whether to persist dismissal across sessions
   * @default false
   */
  persistDismissal?: boolean;
  
  /**
   * Local storage key for dismissal persistence
   * @default 'df-license-dismissed-{context}'
   */
  dismissalStorageKey?: string;
  
  // ========================================================================
  // INTERACTION HANDLERS
  // ========================================================================
  
  /**
   * Handler called when component is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Handler called when an action is triggered
   */
  onActionClick?: (action: LicenseAction) => void;
  
  /**
   * Handler called when component mounts (for analytics)
   */
  onShow?: () => void;
  
  /**
   * Handler called for external link clicks (for tracking)
   */
  onExternalLinkClick?: (url: string, action: LicenseAction) => void;
  
  // ========================================================================
  // ACCESSIBILITY CONFIGURATION (WCAG 2.1 AA COMPLIANCE)
  // ========================================================================
  
  /**
   * ARIA role for the component container
   * @default 'alert' for critical, 'status' for warning
   */
  role?: 'alert' | 'alertdialog' | 'status' | 'banner' | 'region';
  
  /**
   * ARIA live region politeness for screen reader announcements
   * @default 'assertive' for critical, 'polite' for warning
   */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /**
   * Whether the announcement should be atomic (read as single unit)
   * @default true
   */
  'aria-atomic'?: boolean;
  
  /**
   * ARIA label for the entire component (overrides auto-generated)
   */
  'aria-label'?: string;
  
  /**
   * ARIA description providing detailed context
   */
  'aria-describedby'?: string;
  
  /**
   * Whether to announce the license expiration to screen readers
   * @default true
   */
  announceToScreenReader?: boolean;
  
  /**
   * Custom screen reader announcement text
   * @default Auto-generated based on severity and context
   */
  screenReaderText?: string;
  
  /**
   * Focus management configuration for modal display modes
   */
  focusManagement?: {
    /** Element to focus when component appears */
    initialFocus?: React.RefObject<HTMLElement>;
    /** Element to focus when component is dismissed */
    returnFocus?: React.RefObject<HTMLElement>;
    /** Whether to trap focus within component (for modals) */
    trapFocus?: boolean;
  };
  
  // ========================================================================
  // STYLING AND CUSTOMIZATION
  // ========================================================================
  
  /**
   * Custom CSS classes for Tailwind utility composition
   * Supports class-variance-authority integration for dynamic styling
   */
  className?: string;
  
  /**
   * Custom classes for different component parts
   */
  classNames?: {
    /** Container/root element classes */
    container?: string;
    /** Icon container classes */
    icon?: string;
    /** Content area classes */
    content?: string;
    /** Title/heading classes */
    title?: string;
    /** Message/body text classes */
    message?: string;
    /** Actions container classes */
    actions?: string;
    /** Individual action button classes */
    action?: string;
    /** Dismiss button classes */
    dismiss?: string;
  };
  
  /**
   * Custom styles for component parts (escape hatch for non-Tailwind styling)
   */
  styles?: {
    container?: React.CSSProperties;
    content?: React.CSSProperties;
    actions?: React.CSSProperties;
  };
  
  // ========================================================================
  // TESTING AND DEVELOPMENT
  // ========================================================================
  
  /**
   * Test identifier for automated testing
   * @default 'license-expired'
   */
  'data-testid'?: string;
  
  /**
   * Development mode flag for enhanced debugging
   * @default false
   */
  debug?: boolean;
}

// ============================================================================
// VARIANT CONFIGURATION TYPES
// ============================================================================

/**
 * Class-variance-authority configuration for dynamic styling
 * supporting Tailwind CSS utility composition with theme variants
 */
export interface LicenseExpiredVariantConfig {
  base: string;
  variants: {
    /** Theme variant styles */
    theme?: Record<LicenseThemeVariant, string>;
    
    /** Severity level styles */
    severity?: Record<LicenseExpiredSeverity, string>;
    
    /** Display mode styles */
    displayMode?: Record<LicenseDisplayMode, string>;
    
    /** Component size styles */
    size?: Record<ComponentSize, string>;
    
    /** Component state styles */
    state?: Record<ComponentState, string>;
  };
  
  /** Compound variants for complex styling combinations */
  compoundVariants?: Array<{
    theme?: LicenseThemeVariant;
    severity?: LicenseExpiredSeverity;
    displayMode?: LicenseDisplayMode;
    size?: ComponentSize;
    className: string;
  }>;
  
  /** Default variant values */
  defaultVariants?: {
    theme?: LicenseThemeVariant;
    severity?: LicenseExpiredSeverity;
    displayMode?: LicenseDisplayMode;
    size?: ComponentSize;
  };
}

/**
 * Extended component props with variant support
 * for class-variance-authority integration
 */
export type LicenseExpiredVariantProps = VariantProps<LicenseExpiredVariantConfig> & LicenseExpiredProps;

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Action button props extending base button component
 * with license-specific enhancements and accessibility
 */
export interface LicenseActionButtonProps extends ButtonComponent {
  /** License action configuration */
  action: LicenseAction;
  
  /** Whether this is the primary action */
  primary?: boolean;
  
  /** Responsive behavior for mobile layouts */
  responsive?: boolean;
  
  /** Custom loading state for async operations */
  asyncLoading?: boolean;
}

/**
 * License expiration event data for analytics and tracking
 */
export interface LicenseExpiredEvent {
  /** Event type identifier */
  type: 'shown' | 'dismissed' | 'action-clicked' | 'external-link';
  
  /** License context that triggered the event */
  context: LicenseExpiredContext;
  
  /** Severity level at time of event */
  severity: LicenseExpiredSeverity;
  
  /** Display mode when event occurred */
  displayMode: LicenseDisplayMode;
  
  /** Action details for action-related events */
  action?: {
    id: string;
    label: string;
    priority: 'primary' | 'secondary' | 'tertiary';
  };
  
  /** Timestamp of the event */
  timestamp: number;
  
  /** User agent and device information */
  userAgent?: string;
  
  /** Screen size category at time of event */
  screenSize?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * License status hook return type for component integration
 */
export interface LicenseStatus {
  /** Whether license is currently expired */
  isExpired: boolean;
  
  /** Whether license is in warning period */
  isWarning: boolean;
  
  /** Days until expiration (negative if expired) */
  daysRemaining: number;
  
  /** Current license information */
  licenseInfo: LicenseInfo;
  
  /** Suggested actions for current status */
  suggestedActions: LicenseAction[];
  
  /** Whether to show license notification */
  shouldShowNotification: boolean;
  
  /** Recommended severity level */
  recommendedSeverity: LicenseExpiredSeverity;
  
  /** Recommended display mode */
  recommendedDisplayMode: LicenseDisplayMode;
}

/**
 * Configuration object for license expiration behavior
 */
export interface LicenseExpiredConfig {
  /** Days before expiration to start showing warnings */
  warningThreshold: number;
  
  /** Days before expiration to show critical warnings */
  criticalThreshold: number;
  
  /** Whether to persist user dismissals */
  persistDismissals: boolean;
  
  /** Default auto-dismiss timeouts by severity */
  autoDismissTimeouts: Record<LicenseExpiredSeverity, number>;
  
  /** Default display modes by context */
  defaultDisplayModes: Record<LicenseExpiredContext, LicenseDisplayMode>;
  
  /** Analytics tracking configuration */
  analytics: {
    enabled: boolean;
    trackDismissals: boolean;
    trackActions: boolean;
    trackExternalLinks: boolean;
  };
  
  /** Accessibility enhancements */
  accessibility: {
    announceExpirations: boolean;
    focusTrapInModals: boolean;
    respectReducedMotion: boolean;
    highContrastMode: boolean;
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Re-export common React types for convenience
  ReactNode,
  ComponentProps,
};

// Default configuration export
export const defaultLicenseExpiredConfig: LicenseExpiredConfig = {
  warningThreshold: 14, // 2 weeks
  criticalThreshold: 3,  // 3 days
  persistDismissals: false,
  autoDismissTimeouts: {
    warning: 10000,   // 10 seconds
    critical: 0,      // No auto-dismiss
    blocked: 0,       // No auto-dismiss
  },
  defaultDisplayModes: {
    'trial-expired': 'modal',
    'subscription-lapsed': 'banner',
    'feature-restricted': 'card',
    'enterprise-required': 'modal',
    'maintenance-expired': 'banner',
    'user-limit-exceeded': 'modal',
  },
  analytics: {
    enabled: true,
    trackDismissals: true,
    trackActions: true,
    trackExternalLinks: true,
  },
  accessibility: {
    announceExpirations: true,
    focusTrapInModals: true,
    respectReducedMotion: true,
    highContrastMode: false,
  },
};