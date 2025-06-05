/**
 * Alert Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for React 19 Alert component system following
 * WCAG 2.1 AA accessibility requirements and Next.js 15.1 patterns.
 * 
 * @fileoverview Type definitions for accessible, responsive Alert components
 * @version 1.0.0
 */

import { type ReactNode, type HTMLAttributes, type ComponentPropsWithoutRef } from 'react';
import { 
  type BaseComponentProps, 
  type AccessibilityProps,
  type ResponsiveProps,
  type ThemeProps,
  type AnimationProps,
  type InteractionProps
} from '@/types/ui';

/**
 * Alert type variants maintaining exact compatibility with Angular AlertType values
 * These map to WCAG 2.1 AA compliant design tokens with proper contrast ratios
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert visual variants for different presentation styles
 */
export type AlertVariant = 
  | 'filled'     // Solid background with contrasting text
  | 'outlined'   // Border with transparent background  
  | 'soft'       // Subtle background with matching border
  | 'banner';    // Full-width prominent display

/**
 * Alert positioning options for different layout contexts
 */
export type AlertPosition = 
  | 'inline'     // Within content flow
  | 'floating'   // Positioned above content
  | 'sticky'     // Sticky to viewport
  | 'toast';     // Notification overlay

/**
 * Alert size variants for responsive design
 */
export type AlertSize = 'sm' | 'md' | 'lg';

/**
 * Main Alert component props interface
 * Replaces Angular @Input/@Output decorators with React props pattern
 */
export interface AlertProps extends 
  BaseComponentProps<HTMLDivElement>,
  AccessibilityProps,
  ResponsiveProps,
  Pick<AnimationProps, 'disableTransitions' | 'animationDuration'>,
  Pick<InteractionProps, 'onClick'> {
  
  /** Alert semantic type affecting styling and accessibility */
  type: AlertType;
  
  /** Visual variant determining presentation style */
  variant?: AlertVariant;
  
  /** Alert positioning behavior */
  position?: AlertPosition;
  
  /** Size variant for responsive design */
  size?: AlertSize;
  
  /** Alert title text */
  title?: string;
  
  /** Alert description/message content */
  description?: string | ReactNode;
  
  /** Whether alert can be dismissed by user */
  dismissible?: boolean;
  
  /** Auto-dismiss after specified milliseconds */
  autoDismiss?: number;
  
  /** Callback fired when alert is dismissed */
  onDismiss?: () => void;
  
  /** Callback fired before alert is dismissed (can prevent dismissal) */
  onBeforeDismiss?: () => boolean | Promise<boolean>;
  
  /** Show icon based on alert type */
  showIcon?: boolean;
  
  /** Custom icon override */
  icon?: ReactNode;
  
  /** Actions to display in alert */
  actions?: ReactNode;
  
  /** Additional content below description */
  footer?: ReactNode;
  
  /** Alert priority for screen reader announcements */
  priority?: 'low' | 'medium' | 'high';
  
  /** Whether to announce alert content to screen readers */
  announce?: boolean;
  
  /** Custom announcement text override */
  announceText?: string;
  
  /** ARIA live region politeness setting */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /** ARIA atomic setting for complete announcements */
  'aria-atomic'?: boolean;
  
  /** Unique identifier for alert tracking */
  alertId?: string;
  
  /** Associated form field ID for validation alerts */
  fieldId?: string;
  
  /** Whether alert is currently visible */
  visible?: boolean;
  
  /** Animation preset for enter/exit transitions */
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  
  /** Compact styling for space-constrained layouts */
  compact?: boolean;
  
  /** Full width styling */
  fullWidth?: boolean;
  
  /** Elevation shadow level */
  elevation?: 0 | 1 | 2 | 3;
  
  /** Custom CSS classes for styling override */
  className?: string;
  
  /** Style props for container */
  style?: React.CSSProperties;
}

/**
 * Alert Icon component props for compound component pattern
 */
export interface AlertIconProps extends 
  BaseComponentProps<HTMLSpanElement>,
  AccessibilityProps {
  
  /** Alert type for default icon selection */
  type: AlertType;
  
  /** Custom icon element */
  icon?: ReactNode;
  
  /** Icon size variant */
  size?: AlertSize;
  
  /** Whether icon should be colored */
  colored?: boolean;
  
  /** Custom icon classes */
  iconClassName?: string;
  
  /** Accessibility label for icon */
  'aria-label'?: string;
  
  /** Whether icon is decorative only */
  decorative?: boolean;
}

/**
 * Alert Content component props for text and message display
 */
export interface AlertContentProps extends 
  BaseComponentProps<HTMLDivElement>,
  AccessibilityProps {
  
  /** Alert title text */
  title?: string;
  
  /** Alert description content */
  description?: string | ReactNode;
  
  /** Content size variant */
  size?: AlertSize;
  
  /** Whether content should be truncated */
  truncate?: boolean;
  
  /** Maximum lines before truncation */
  maxLines?: number;
  
  /** Title element type for semantic structure */
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
  
  /** Title custom classes */
  titleClassName?: string;
  
  /** Description custom classes */
  descriptionClassName?: string;
  
  /** Whether to render rich content (HTML) */
  allowHTML?: boolean;
}

/**
 * Alert Dismiss component props for close functionality
 */
export interface AlertDismissProps extends 
  BaseComponentProps<HTMLButtonElement>,
  AccessibilityProps,
  Pick<InteractionProps, 'onClick'> {
  
  /** Dismiss callback function */
  onDismiss: () => void;
  
  /** Button size variant */
  size?: AlertSize;
  
  /** Custom dismiss icon */
  icon?: ReactNode;
  
  /** Button label for accessibility */
  'aria-label'?: string;
  
  /** Whether button should be visually hidden but accessible */
  srOnly?: boolean;
  
  /** Custom button classes */
  buttonClassName?: string;
  
  /** Keyboard shortcut for dismissal */
  shortcut?: string;
  
  /** Confirmation before dismissal */
  requireConfirmation?: boolean;
  
  /** Confirmation message text */
  confirmationText?: string;
}

/**
 * Alert Actions component props for action buttons
 */
export interface AlertActionsProps extends 
  BaseComponentProps<HTMLDivElement>,
  AccessibilityProps {
  
  /** Action buttons or elements */
  actions: ReactNode;
  
  /** Actions layout direction */
  layout?: 'horizontal' | 'vertical';
  
  /** Actions alignment */
  alignment?: 'start' | 'center' | 'end' | 'between';
  
  /** Actions size variant */
  size?: AlertSize;
  
  /** Spacing between actions */
  spacing?: 'compact' | 'normal' | 'relaxed';
  
  /** Whether actions should stack on mobile */
  stackOnMobile?: boolean;
  
  /** Custom actions container classes */
  actionsClassName?: string;
}

/**
 * Alert Container props for managing multiple alerts
 */
export interface AlertContainerProps extends 
  BaseComponentProps<HTMLDivElement>,
  ResponsiveProps {
  
  /** Container position in viewport */
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  
  /** Maximum number of visible alerts */
  maxAlerts?: number;
  
  /** Container spacing from viewport edges */
  spacing?: number;
  
  /** Container z-index */
  zIndex?: number;
  
  /** Whether container should be portal-rendered */
  portal?: boolean;
  
  /** Portal container element */
  portalContainer?: HTMLElement;
  
  /** Animation preset for container */
  animation?: 'slide' | 'fade' | 'scale';
  
  /** Whether to reverse alert order (newest first) */
  reverseOrder?: boolean;
  
  /** Container width constraint */
  maxWidth?: number | string;
}

/**
 * Responsive alert behavior configuration
 */
export interface AlertResponsiveConfig extends ResponsiveProps {
  /** Breakpoint-specific variants */
  variants?: {
    mobile?: AlertVariant;
    tablet?: AlertVariant;
    desktop?: AlertVariant;
  };
  
  /** Breakpoint-specific sizes */
  sizes?: {
    mobile?: AlertSize;
    tablet?: AlertSize;
    desktop?: AlertSize;
  };
  
  /** Breakpoint-specific positions */
  positions?: {
    mobile?: AlertPosition;
    tablet?: AlertPosition;
    desktop?: AlertPosition;
  };
  
  /** Auto-stack actions on small screens */
  stackActionsOnMobile?: boolean;
  
  /** Collapse to compact on mobile */
  compactOnMobile?: boolean;
}

/**
 * Alert accessibility configuration
 */
export interface AlertAccessibilityConfig extends AccessibilityProps {
  /** Screen reader priority level */
  priority?: 'low' | 'medium' | 'high';
  
  /** Auto-focus alert when shown */
  autoFocus?: boolean;
  
  /** Focus trap within alert */
  trapFocus?: boolean;
  
  /** Return focus to trigger element on dismiss */
  returnFocus?: boolean;
  
  /** Keyboard navigation support */
  keyboardNavigation?: boolean;
  
  /** High contrast mode support */
  highContrast?: boolean;
  
  /** Reduced motion compliance */
  respectReducedMotion?: boolean;
  
  /** Voice control commands */
  voiceCommands?: string[];
}

/**
 * Alert theme configuration for consistent styling
 */
export interface AlertThemeConfig extends ThemeProps {
  /** Color mappings for alert types */
  typeColors?: Partial<Record<AlertType, string>>;
  
  /** Icon mappings for alert types */
  typeIcons?: Partial<Record<AlertType, ReactNode>>;
  
  /** Border radius override */
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** Typography scale override */
  typography?: {
    title?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
    description?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  };
  
  /** Animation configuration */
  animations?: {
    duration?: number;
    easing?: string;
    enableReducedMotion?: boolean;
  };
}

/**
 * Alert validation state for form integration
 */
export interface AlertValidationState {
  /** Validation state type */
  state: 'valid' | 'invalid' | 'warning' | 'info';
  
  /** Associated form field */
  fieldId?: string;
  
  /** Validation error details */
  errors?: string[];
  
  /** Validation warnings */
  warnings?: string[];
  
  /** Field validation status */
  touched?: boolean;
  
  /** Field dirty status */
  dirty?: boolean;
}

/**
 * Alert event handlers for lifecycle management
 */
export interface AlertEventHandlers {
  /** Called when alert mounts */
  onMount?: (alertId: string) => void;
  
  /** Called when alert unmounts */
  onUnmount?: (alertId: string) => void;
  
  /** Called when alert becomes visible */
  onShow?: (alertId: string) => void;
  
  /** Called when alert becomes hidden */
  onHide?: (alertId: string) => void;
  
  /** Called when user interacts with alert */
  onInteraction?: (alertId: string, interaction: string) => void;
  
  /** Called when auto-dismiss timer starts */
  onAutoDismissStart?: (alertId: string, duration: number) => void;
  
  /** Called when auto-dismiss timer completes */
  onAutoDismissComplete?: (alertId: string) => void;
}

/**
 * Alert compound component type definition
 */
export interface AlertCompoundComponent {
  /** Main Alert component */
  Alert: React.ComponentType<AlertProps>;
  
  /** Alert Icon subcomponent */
  Icon: React.ComponentType<AlertIconProps>;
  
  /** Alert Content subcomponent */
  Content: React.ComponentType<AlertContentProps>;
  
  /** Alert Dismiss subcomponent */
  Dismiss: React.ComponentType<AlertDismissProps>;
  
  /** Alert Actions subcomponent */
  Actions: React.ComponentType<AlertActionsProps>;
  
  /** Alert Container for multiple alerts */
  Container: React.ComponentType<AlertContainerProps>;
}

/**
 * Default alert configuration values
 */
export const ALERT_DEFAULTS = {
  type: 'info' as AlertType,
  variant: 'soft' as AlertVariant,
  position: 'inline' as AlertPosition,
  size: 'md' as AlertSize,
  showIcon: true,
  dismissible: false,
  announce: true,
  priority: 'medium' as const,
  'aria-live': 'polite' as const,
  'aria-atomic': true,
  animation: 'fade' as const,
  disableTransitions: false,
  respectReducedMotion: true,
  elevation: 0,
  fullWidth: false,
  compact: false,
} as const;

/**
 * Type-specific default configurations
 */
export const ALERT_TYPE_CONFIGS: Record<AlertType, Partial<AlertProps>> = {
  success: {
    'aria-live': 'polite',
    priority: 'medium',
    announce: true,
  },
  error: {
    'aria-live': 'assertive',
    priority: 'high',
    announce: true,
    dismissible: true,
  },
  warning: {
    'aria-live': 'polite',
    priority: 'medium',
    announce: true,
  },
  info: {
    'aria-live': 'polite',
    priority: 'low',
    announce: false,
  },
} as const;

/**
 * Export all alert-related types for external consumption
 */
export type {
  AlertProps,
  AlertIconProps,
  AlertContentProps,
  AlertDismissProps,
  AlertActionsProps,
  AlertContainerProps,
  AlertResponsiveConfig,
  AlertAccessibilityConfig,
  AlertThemeConfig,
  AlertValidationState,
  AlertEventHandlers,
  AlertCompoundComponent,
};