/**
 * Alert Component Type Definitions for DreamFactory Admin Interface
 * 
 * Comprehensive TypeScript types for the Alert component system supporting WCAG 2.1 AA
 * accessibility compliance, responsive design with Tailwind CSS, and compound component patterns.
 * 
 * Replaces Angular AlertType and component decorators with modern React TypeScript patterns
 * while maintaining exact compatibility with existing Angular alert variant values.
 */

import { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';
import { 
  BaseComponent, 
  ComponentVariant, 
  ComponentSize, 
  ResponsiveValue,
  ComponentVariantConfig
} from '@/types/ui';

// ============================================================================
// CORE ALERT TYPES
// ============================================================================

/**
 * Alert type union maintaining exact compatibility with Angular AlertType values
 * 
 * Maps to DreamFactory message severity levels:
 * - 'success': Successful operations (database connections, API generation)
 * - 'error': Error states (connection failures, validation errors)  
 * - 'warning': Warning conditions (deprecated features, performance issues)
 * - 'info': Informational messages (helpful tips, status updates)
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert variant mapping for enhanced styling options
 * Extends base ComponentVariant while maintaining AlertType compatibility
 */
export type AlertVariant = AlertType | 'ghost' | 'outline' | 'solid';

/**
 * Alert positioning options for different display contexts
 */
export type AlertPosition = 
  | 'fixed-top' 
  | 'fixed-bottom' 
  | 'inline' 
  | 'floating' 
  | 'banner';

/**
 * Alert display duration configuration
 */
export type AlertDuration = 
  | number           // Milliseconds
  | 'persistent'     // Manual dismissal only
  | 'auto'          // Default auto-dismiss timing
  | 'brief'         // Quick flash message
  | 'extended';     // Longer display for complex messages

// ============================================================================
// MAIN ALERT COMPONENT INTERFACE
// ============================================================================

/**
 * Primary Alert component props interface
 * Replaces Angular @Input/@Output decorators with React props pattern
 */
export interface AlertProps extends BaseComponent {
  /** Alert type/severity level - maintains Angular AlertType compatibility */
  variant: AlertType;
  
  /** Alert message content */
  message: string | ReactNode;
  
  /** Optional title for structured alerts */
  title?: string;
  
  /** Alert size affecting padding and text size */
  size?: ComponentSize;
  
  /** Alert position and layout behavior */
  position?: AlertPosition;
  
  /** Auto-dismiss configuration */
  duration?: AlertDuration;
  
  /** Whether alert can be manually dismissed */
  dismissible?: boolean;
  
  /** Whether to show icon indicator */
  showIcon?: boolean;
  
  /** Whether to include border styling */
  bordered?: boolean;
  
  /** Whether to show rounded corners */
  rounded?: boolean;
  
  /** Custom icon override (React component or icon name) */
  icon?: ReactNode | string;
  
  /** Alert actions/buttons */
  actions?: AlertAction[];
  
  // Event Handlers (replacing Angular @Output decorators)
  /** Callback fired when alert is dismissed */
  onDismiss?: () => void;
  
  /** Callback fired when alert action is clicked */
  onAction?: (actionId: string) => void;
  
  /** Callback fired when alert is shown */
  onShow?: () => void;
  
  /** Callback fired when alert auto-hides */
  onHide?: () => void;
  
  // Responsive Design Support
  /** Responsive size configuration */
  responsiveSize?: ResponsiveValue<ComponentSize>;
  
  /** Responsive position behavior */
  responsivePosition?: ResponsiveValue<AlertPosition>;
  
  /** Hide on specific breakpoints */
  hideOn?: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>;
  
  // Enhanced Accessibility Props (WCAG 2.1 AA Compliance)
  /** ARIA role override (default: 'alert' for errors, 'status' for others) */
  role?: 'alert' | 'status' | 'alertdialog' | 'banner' | 'region';
  
  /** ARIA live region politeness level */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /** Whether alert content is atomic (announced completely) */
  'aria-atomic'?: boolean;
  
  /** ARIA label for non-text alerts or additional context */
  'aria-label'?: string;
  
  /** ID of element providing additional description */
  'aria-describedby'?: string;
  
  /** Announce message to screen readers on show */
  announceOnShow?: boolean;
  
  /** Custom announcement text for screen readers */
  screenReaderText?: string;
  
  // Advanced Styling
  /** Class variance authority variant props */
  variantConfig?: VariantProps<ComponentVariantConfig>;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Additional container props */
  containerProps?: HTMLAttributes<HTMLDivElement>;
}

/**
 * Alert action configuration for interactive alerts
 */
export interface AlertAction {
  /** Unique identifier for the action */
  id: string;
  
  /** Action button text */
  label: string;
  
  /** Action button variant */
  variant?: ComponentVariant;
  
  /** Action button size */
  size?: ComponentSize;
  
  /** Whether action is primary (emphasized) */
  primary?: boolean;
  
  /** Action handler function */
  handler: (actionId: string) => void;
  
  /** Additional button props */
  buttonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  
  // Accessibility
  /** ARIA label for the action button */
  'aria-label'?: string;
  
  /** Keyboard shortcut hint */
  keyboardShortcut?: string;
}

// ============================================================================
// COMPOUND COMPONENT PROP TYPES
// ============================================================================

/**
 * Alert Icon component props for compound pattern
 */
export interface AlertIconProps extends BaseComponent {
  /** Alert type for automatic icon selection */
  type: AlertType;
  
  /** Custom icon override */
  icon?: ReactNode | string;
  
  /** Icon size */
  size?: ComponentSize;
  
  /** Whether to use colored icons */
  colored?: boolean;
  
  /** Custom icon color */
  color?: string;
  
  /** Icon animation type */
  animation?: 'none' | 'pulse' | 'spin' | 'bounce' | 'fade-in';
  
  // Accessibility
  /** Whether icon is decorative (hidden from screen readers) */
  decorative?: boolean;
  
  /** Alt text for icon */
  alt?: string;
  
  /** ARIA label for icon */
  'aria-label'?: string;
}

/**
 * Alert Content component props for compound pattern
 */
export interface AlertContentProps extends BaseComponent {
  /** Content title */
  title?: string;
  
  /** Main content message */
  message: string | ReactNode;
  
  /** Content layout variant */
  layout?: 'horizontal' | 'vertical' | 'compact';
  
  /** Typography variant for title */
  titleVariant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle' | 'body';
  
  /** Typography variant for message */
  messageVariant?: 'body' | 'caption' | 'small' | 'large';
  
  /** Maximum lines before truncation */
  maxLines?: number;
  
  /** Whether to allow rich content/HTML */
  allowRichContent?: boolean;
  
  // Accessibility
  /** ARIA level for title headings */
  titleAriaLevel?: number;
  
  /** Whether content should be announced as atomic unit */
  atomic?: boolean;
}

/**
 * Alert Dismiss button component props for compound pattern
 */
export interface AlertDismissProps extends BaseComponent {
  /** Dismiss button variant */
  variant?: 'icon' | 'text' | 'button';
  
  /** Button size */
  size?: ComponentSize;
  
  /** Custom dismiss label */
  label?: string;
  
  /** Custom dismiss icon */
  icon?: ReactNode | string;
  
  /** Position relative to alert content */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  
  /** Dismiss handler */
  onDismiss: () => void;
  
  /** Keyboard shortcut for dismissal */
  keyboardShortcut?: string;
  
  // Accessibility
  /** ARIA label for dismiss button */
  'aria-label'?: string;
  
  /** Tooltip text for dismiss button */
  tooltip?: string;
  
  /** Whether to include keyboard instructions */
  showKeyboardHint?: boolean;
}

// ============================================================================
// ALERT CONTAINER AND SYSTEM TYPES
// ============================================================================

/**
 * Alert container props for managing multiple alerts
 */
export interface AlertContainerProps extends BaseComponent {
  /** Container position */
  position?: AlertPosition;
  
  /** Maximum number of visible alerts */
  maxAlerts?: number;
  
  /** Alert stacking direction */
  stackDirection?: 'up' | 'down' | 'left' | 'right';
  
  /** Spacing between alerts */
  spacing?: ComponentSize;
  
  /** Container width configuration */
  width?: 'auto' | 'full' | 'content' | ResponsiveValue<string>;
  
  /** Z-index for positioning */
  zIndex?: number;
  
  /** Animation presets for alert transitions */
  animation?: {
    enter?: string;
    exit?: string;
    duration?: number;
  };
  
  // Responsive behavior
  /** Responsive position overrides */
  responsivePosition?: ResponsiveValue<AlertPosition>;
  
  /** Responsive max alerts */
  responsiveMaxAlerts?: ResponsiveValue<number>;
  
  // Accessibility
  /** ARIA label for alert container */
  'aria-label'?: string;
  
  /** Live region role for container */
  role?: 'region' | 'banner' | 'complementary';
}

/**
 * Alert system configuration for global defaults
 */
export interface AlertSystemConfig {
  /** Default alert duration by type */
  defaultDurations: Record<AlertType, AlertDuration>;
  
  /** Default icons by alert type */
  defaultIcons: Record<AlertType, ReactNode | string>;
  
  /** WCAG compliance settings */
  accessibility: {
    /** Default ARIA live region behavior */
    defaultAriaLive: Record<AlertType, 'polite' | 'assertive'>;
    
    /** Default roles by alert type */
    defaultRoles: Record<AlertType, string>;
    
    /** Announce alerts to screen readers by default */
    announceByDefault: boolean;
    
    /** Focus management for modal alerts */
    manageFocus: boolean;
  };
  
  /** Animation preferences */
  animations: {
    /** Enable/disable animations globally */
    enabled: boolean;
    
    /** Respect user's reduced motion preferences */
    respectReducedMotion: boolean;
    
    /** Default animation duration */
    defaultDuration: number;
  };
  
  /** Responsive breakpoints */
  breakpoints: Record<string, string>;
  
  /** Theme integration */
  theme: {
    /** Color scheme support */
    supportColorSchemes: ('light' | 'dark' | 'auto')[];
    
    /** High contrast mode support */
    supportHighContrast: boolean;
  };
}

// ============================================================================
// STYLING AND VARIANT CONFIGURATION
// ============================================================================

/**
 * Alert styling configuration with class-variance-authority integration
 */
export interface AlertVariantConfig extends ComponentVariantConfig {
  variants: {
    /** Alert type/variant styling */
    variant: Record<AlertVariant, string>;
    
    /** Size-based styling */
    size: Record<ComponentSize, string>;
    
    /** Position-based styling */
    position: Record<AlertPosition, string>;
    
    /** Border styling options */
    bordered: Record<'true' | 'false', string>;
    
    /** Icon display options */
    withIcon: Record<'true' | 'false', string>;
  };
  
  /** Compound variant combinations */
  compoundVariants: Array<{
    variant?: AlertVariant;
    size?: ComponentSize;
    position?: AlertPosition;
    bordered?: boolean;
    withIcon?: boolean;
    className: string;
  }>;
  
  /** Default variant values */
  defaultVariants: {
    variant: AlertType;
    size: ComponentSize;
    position: AlertPosition;
    bordered: boolean;
    withIcon: boolean;
  };
}

/**
 * Alert theme configuration for design system integration
 */
export interface AlertThemeConfig {
  /** Color mappings by alert type */
  colors: Record<AlertType, {
    background: string;
    foreground: string;
    border: string;
    icon: string;
    accent: string;
  }>;
  
  /** Typography settings */
  typography: {
    title: {
      fontSize: Record<ComponentSize, string>;
      fontWeight: string;
      lineHeight: string;
    };
    message: {
      fontSize: Record<ComponentSize, string>;
      fontWeight: string;
      lineHeight: string;
    };
  };
  
  /** Spacing configuration */
  spacing: {
    padding: Record<ComponentSize, string>;
    margin: Record<ComponentSize, string>;
    iconSpacing: Record<ComponentSize, string>;
  };
  
  /** Border radius settings */
  borderRadius: Record<ComponentSize, string>;
  
  /** Shadow/elevation settings */
  shadows: Record<AlertPosition, string>;
  
  /** Animation timing */
  animations: {
    duration: Record<'fast' | 'normal' | 'slow', string>;
    easing: Record<'ease' | 'ease-in' | 'ease-out' | 'ease-in-out', string>;
  };
}

// ============================================================================
// HOOK AND UTILITY TYPES
// ============================================================================

/**
 * Alert state management hook return type
 */
export interface UseAlertReturn {
  /** Currently active alerts */
  alerts: AlertInstance[];
  
  /** Show a new alert */
  showAlert: (alert: Omit<AlertProps, 'id'>) => string;
  
  /** Dismiss an alert by ID */
  dismissAlert: (id: string) => void;
  
  /** Dismiss all alerts */
  dismissAll: () => void;
  
  /** Update an existing alert */
  updateAlert: (id: string, updates: Partial<AlertProps>) => void;
  
  /** Check if alert exists */
  hasAlert: (id: string) => boolean;
  
  /** Get alert by ID */
  getAlert: (id: string) => AlertInstance | undefined;
}

/**
 * Alert instance with runtime metadata
 */
export interface AlertInstance extends AlertProps {
  /** Unique runtime identifier */
  id: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Whether alert is currently visible */
  visible: boolean;
  
  /** Auto-dismiss timer reference */
  timerId?: NodeJS.Timeout;
  
  /** Update count for re-renders */
  updateCount: number;
}

/**
 * Alert accessibility utilities return type
 */
export interface AlertAccessibilityUtils {
  /** Get appropriate ARIA role for alert type */
  getRole: (type: AlertType) => string;
  
  /** Get appropriate aria-live value for alert type */
  getAriaLive: (type: AlertType) => 'polite' | 'assertive';
  
  /** Generate screen reader announcement text */
  getAnnouncement: (alert: AlertProps) => string;
  
  /** Check if alert meets WCAG contrast requirements */
  validateContrast: (type: AlertType, background?: string) => boolean;
  
  /** Get keyboard navigation instructions */
  getKeyboardInstructions: (alert: AlertProps) => string;
}

// ============================================================================
// TYPE GUARDS AND VALIDATORS
// ============================================================================

/**
 * Type guard for AlertType
 */
export function isAlertType(value: unknown): value is AlertType {
  return typeof value === 'string' && 
    ['success', 'error', 'warning', 'info'].includes(value);
}

/**
 * Type guard for AlertVariant
 */
export function isAlertVariant(value: unknown): value is AlertVariant {
  return typeof value === 'string' && 
    ['success', 'error', 'warning', 'info', 'ghost', 'outline', 'solid'].includes(value);
}

/**
 * Type guard for AlertPosition
 */
export function isAlertPosition(value: unknown): value is AlertPosition {
  return typeof value === 'string' && 
    ['fixed-top', 'fixed-bottom', 'inline', 'floating', 'banner'].includes(value);
}

/**
 * Validation function for AlertProps
 */
export function validateAlertProps(props: Partial<AlertProps>): props is AlertProps {
  return !!(
    props.variant && 
    isAlertType(props.variant) && 
    props.message !== undefined &&
    props.message !== null
  );
}

// ============================================================================
// EXPORT TYPES FOR EXTERNAL USE
// ============================================================================

export type {
  // Re-export React types for convenience
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
  
  // Re-export UI base types
  BaseComponent,
  ComponentVariant,
  ComponentSize,
  ResponsiveValue,
  ComponentVariantConfig,
} from '@/types/ui';

/**
 * Complete Alert component type bundle for external imports
 */
export interface AlertTypeBundle {
  // Core types
  AlertType: AlertType;
  AlertVariant: AlertVariant;
  AlertPosition: AlertPosition;
  AlertDuration: AlertDuration;
  
  // Component props
  AlertProps: AlertProps;
  AlertAction: AlertAction;
  
  // Compound component props
  AlertIconProps: AlertIconProps;
  AlertContentProps: AlertContentProps;
  AlertDismissProps: AlertDismissProps;
  
  // Container and system
  AlertContainerProps: AlertContainerProps;
  AlertSystemConfig: AlertSystemConfig;
  
  // Styling and theming
  AlertVariantConfig: AlertVariantConfig;
  AlertThemeConfig: AlertThemeConfig;
  
  // Runtime and utilities
  UseAlertReturn: UseAlertReturn;
  AlertInstance: AlertInstance;
  AlertAccessibilityUtils: AlertAccessibilityUtils;
}

// Default export for comprehensive type access
export default AlertTypeBundle;