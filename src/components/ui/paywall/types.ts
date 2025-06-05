/**
 * Paywall Component Type Definitions
 * 
 * Comprehensive TypeScript interfaces for the React 19 Paywall component system
 * supporting feature gating, subscription management, and Calendly integration.
 * Follows Next.js 15.1 patterns and WCAG 2.1 AA accessibility requirements.
 * 
 * @fileoverview Paywall component type definitions with Calendly integration
 * @version 1.0.0
 */

import { type ReactNode, type ForwardedRef, type HTMLAttributes } from 'react';
import { 
  type BaseComponentProps,
  type AccessibilityProps,
  type ThemeProps,
  type ResponsiveProps,
  type AnimationProps,
  type FocusProps,
  type InteractionProps,
  type LoadingState,
  type ValidationState
} from '../../../types/ui';

/**
 * Paywall feature restriction levels
 * Defines different levels of access control for feature gating
 */
export type PaywallLevel = 
  | 'free'           // Free tier - basic features
  | 'starter'        // Starter plan - limited features
  | 'professional'   // Professional plan - advanced features
  | 'enterprise'     // Enterprise plan - all features
  | 'trial';         // Trial period - temporary access

/**
 * Paywall display variants for different use cases
 */
export type PaywallVariant =
  | 'modal'          // Modal overlay blocking interaction
  | 'inline'         // Inline component within content
  | 'banner'         // Top/bottom banner notification
  | 'sidebar'        // Side panel for feature promotion
  | 'tooltip';       // Tooltip-style micro-interaction

/**
 * Internationalization keys specific to paywall component
 * Supports react-i18next translation system
 */
export interface PaywallTranslationKeys {
  /** Main paywall title key */
  titleKey?: string;
  /** Paywall description/message key */
  descriptionKey?: string;
  /** Primary action button text key */
  primaryActionKey?: string;
  /** Secondary action button text key */
  secondaryActionKey?: string;
  /** Close button text key */
  closeButtonKey?: string;
  /** Feature list items keys */
  featuresKey?: string[];
  /** Pricing information key */
  pricingKey?: string;
  /** Trial information key */
  trialInfoKey?: string;
  /** Contact sales text key */
  contactSalesKey?: string;
  /** Loading state message key */
  loadingKey?: string;
  /** Error state message key */
  errorKey?: string;
  /** Success state message key */
  successKey?: string;
}

/**
 * Calendly widget configuration for scheduling demos and sales calls
 * Provides type-safe configuration for external Calendly service integration
 */
export interface CalendlyConfig {
  /** Calendly URL for the scheduling widget */
  url: string;
  /** Widget configuration options */
  options?: {
    /** Widget height in pixels */
    height?: number;
    /** Widget width in pixels or percentage */
    width?: number | string;
    /** Minimum widget height */
    minWidth?: number;
    /** Hide event type details */
    hideEventTypeDetails?: boolean;
    /** Hide landing page details */
    hideLandingPageDetails?: boolean;
    /** Primary color customization */
    primaryColor?: string;
    /** Text color customization */
    textColor?: string;
    /** Background color customization */
    backgroundColor?: string;
    /** Prefilled data for the form */
    prefill?: {
      /** Prefilled name */
      name?: string;
      /** Prefilled email */
      email?: string;
      /** Prefilled phone number */
      phone?: string;
      /** Custom questions answers */
      customAnswers?: Record<string, string>;
    };
    /** UTM parameters for tracking */
    utm?: {
      /** UTM source */
      utmSource?: string;
      /** UTM medium */
      utmMedium?: string;
      /** UTM campaign */
      utmCampaign?: string;
      /** UTM term */
      utmTerm?: string;
      /** UTM content */
      utmContent?: string;
    };
  };
  /** Calendly widget event handlers */
  onEventScheduled?: (event: CalendlyEvent) => void;
  /** Widget load success handler */
  onWidgetLoad?: () => void;
  /** Widget load error handler */
  onWidgetError?: (error: Error) => void;
  /** Widget height change handler */
  onHeightChange?: (height: number) => void;
}

/**
 * Calendly event details when a meeting is scheduled
 */
export interface CalendlyEvent {
  /** Event UUID */
  eventUuid: string;
  /** Event type UUID */
  eventTypeUuid: string;
  /** Invitee information */
  invitee: {
    /** Invitee name */
    name: string;
    /** Invitee email */
    email: string;
    /** Invitee phone number */
    phone?: string;
    /** Custom question responses */
    customResponses?: Record<string, string>;
  };
  /** Scheduled event details */
  event: {
    /** Event start time */
    startTime: string;
    /** Event end time */
    endTime: string;
    /** Event location */
    location?: string;
    /** Meeting join URL */
    joinUrl?: string;
  };
}

/**
 * Feature gate configuration for specific features
 */
export interface FeatureGate {
  /** Feature identifier */
  featureId: string;
  /** Required subscription level */
  requiredLevel: PaywallLevel;
  /** Custom feature description */
  description?: string;
  /** Feature category for grouping */
  category?: string;
  /** Feature priority for display order */
  priority?: number;
  /** Custom upgrade message */
  upgradeMessage?: string;
}

/**
 * Paywall analytics and tracking configuration
 */
export interface PaywallAnalytics {
  /** Track paywall impressions */
  trackImpressions?: boolean;
  /** Track upgrade clicks */
  trackUpgradeClicks?: boolean;
  /** Track Calendly interactions */
  trackCalendlyInteractions?: boolean;
  /** Track dismissals */
  trackDismissals?: boolean;
  /** Custom event tracking */
  onAnalyticsEvent?: (event: string, properties?: Record<string, any>) => void;
}

/**
 * Paywall content configuration
 */
export interface PaywallContent {
  /** Main title text */
  title?: string;
  /** Description/message text */
  description?: string;
  /** List of premium features */
  features?: Array<{
    /** Feature title */
    title: string;
    /** Feature description */
    description?: string;
    /** Feature icon */
    icon?: ReactNode;
    /** Feature availability by plan */
    availableIn?: PaywallLevel[];
  }>;
  /** Pricing information */
  pricing?: {
    /** Price amount */
    amount: number;
    /** Currency code */
    currency: string;
    /** Billing period */
    period: 'monthly' | 'yearly' | 'one-time';
    /** Price formatting options */
    formatOptions?: Intl.NumberFormatOptions;
  };
  /** Trial information */
  trial?: {
    /** Trial duration in days */
    duration: number;
    /** Trial description */
    description?: string;
    /** Trial features included */
    features?: string[];
  };
}

/**
 * PaywallRef interface for component ref handling and DOM element access
 * Provides methods for programmatic control of the paywall component
 */
export interface PaywallRef {
  /** Reference to the main paywall container element */
  element: HTMLDivElement | null;
  /** Show the paywall programmatically */
  show: () => void;
  /** Hide the paywall programmatically */
  hide: () => void;
  /** Toggle paywall visibility */
  toggle: () => void;
  /** Focus the primary action button */
  focusPrimaryAction: () => void;
  /** Reset the paywall state */
  reset: () => void;
  /** Check if Calendly widget is loaded */
  isCalendlyLoaded: () => boolean;
  /** Refresh Calendly widget */
  refreshCalendly: () => void;
}

/**
 * Enhanced loading state for paywall with Calendly integration
 */
export interface PaywallLoadingState extends LoadingState {
  /** Calendly widget loading state */
  calendlyLoading?: boolean;
  /** Widget initialization progress */
  widgetProgress?: number;
  /** Specific loading stage */
  loadingStage?: 'initializing' | 'loading-content' | 'loading-calendly' | 'ready';
}

/**
 * Enhanced error state for paywall operations
 */
export interface PaywallErrorState {
  /** General error state */
  hasError: boolean;
  /** Error message */
  message?: string;
  /** Error code for debugging */
  code?: string;
  /** Calendly-specific errors */
  calendlyError?: boolean;
  /** Network connectivity error */
  networkError?: boolean;
  /** Configuration error */
  configError?: boolean;
  /** Error recovery action */
  retryAction?: () => void;
}

/**
 * Comprehensive PaywallProps interface replacing Angular @Input/@Output decorators
 * with React props pattern for full type safety and accessibility compliance
 */
export interface PaywallProps extends 
  BaseComponentProps<HTMLDivElement>,
  AccessibilityProps,
  ThemeProps,
  ResponsiveProps,
  AnimationProps,
  FocusProps,
  Pick<InteractionProps, 'onClick'> {
  
  /** Paywall visibility state */
  isVisible?: boolean;
  /** Paywall display variant */
  variant?: PaywallVariant;
  /** Required subscription level for access */
  requiredLevel: PaywallLevel;
  /** Current user's subscription level */
  currentLevel?: PaywallLevel;
  /** Feature being gated (optional, for analytics) */
  feature?: FeatureGate;
  
  /** Paywall content configuration */
  content?: PaywallContent;
  /** Internationalization keys */
  translations?: PaywallTranslationKeys;
  /** Analytics and tracking configuration */
  analytics?: PaywallAnalytics;
  
  /** Calendly integration configuration */
  calendlyConfig?: CalendlyConfig;
  /** Show Calendly widget instead of default upgrade flow */
  showCalendly?: boolean;
  /** Calendly widget container class */
  calendlyClassName?: string;
  
  /** Loading state for async operations */
  loadingState?: PaywallLoadingState;
  /** Error state for failed operations */
  errorState?: PaywallErrorState;
  
  /** Event Handlers */
  /** Called when user clicks primary upgrade action */
  onUpgradeClick?: (level: PaywallLevel) => void;
  /** Called when user clicks secondary action (trial, demo, etc.) */
  onSecondaryAction?: (action: string) => void;
  /** Called when paywall is dismissed */
  onDismiss?: () => void;
  /** Called when paywall becomes visible */
  onShow?: () => void;
  /** Called when paywall becomes hidden */
  onHide?: () => void;
  /** Called when Calendly event is scheduled */
  onCalendlyEventScheduled?: (event: CalendlyEvent) => void;
  /** Called when Calendly widget loads successfully */
  onCalendlyLoad?: () => void;
  /** Called when Calendly widget encounters error */
  onCalendlyError?: (error: Error) => void;
  
  /** Accessibility and UX */
  /** Automatically show paywall on component mount */
  autoShow?: boolean;
  /** Allow closing paywall with escape key */
  closeOnEscape?: boolean;
  /** Allow closing paywall by clicking backdrop (modal variant) */
  closeOnBackdrop?: boolean;
  /** Trap focus within paywall (modal variant) */
  trapFocus?: boolean;
  /** Restore focus to trigger element when closed */
  restoreFocus?: boolean;
  /** Custom focus target after paywall closes */
  focusTargetOnClose?: string | HTMLElement;
  
  /** Styling and Layout */
  /** Container class for paywall wrapper */
  containerClassName?: string;
  /** Content area class */
  contentClassName?: string;
  /** Header area class */
  headerClassName?: string;
  /** Footer area class */
  footerClassName?: string;
  /** Primary action button class */
  primaryActionClassName?: string;
  /** Secondary action button class */
  secondaryActionClassName?: string;
  /** Backdrop/overlay class (modal variant) */
  backdropClassName?: string;
  
  /** Advanced Configuration */
  /** Custom content renderer override */
  renderContent?: (props: PaywallProps) => ReactNode;
  /** Custom header renderer override */
  renderHeader?: (props: PaywallProps) => ReactNode;
  /** Custom footer renderer override */
  renderFooter?: (props: PaywallProps) => ReactNode;
  /** Custom action buttons renderer override */
  renderActions?: (props: PaywallProps) => ReactNode;
  
  /** Responsive Design Support */
  /** Mobile-specific variant override */
  mobileVariant?: PaywallVariant;
  /** Tablet-specific variant override */
  tabletVariant?: PaywallVariant;
  /** Desktop-specific variant override */
  desktopVariant?: PaywallVariant;
  
  /** Animation and Transitions */
  /** Entry animation type */
  enterAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
  /** Exit animation type */
  exitAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'none';
  /** Animation duration override */
  animationDuration?: number;
  /** Animation delay before showing */
  showDelay?: number;
  
  /** Testing and Development */
  /** Test ID for automated testing */
  'data-testid'?: string;
  /** Development mode flag for debugging */
  debugMode?: boolean;
  /** Mock mode for testing without real Calendly */
  mockMode?: boolean;
}

/**
 * Props for PaywallTrigger component that shows paywall on interaction
 */
export interface PaywallTriggerProps extends 
  BaseComponentProps<HTMLButtonElement>,
  AccessibilityProps,
  ThemeProps {
  
  /** Trigger element content */
  children: ReactNode;
  /** Paywall configuration to show */
  paywallProps: PaywallProps;
  /** Trigger interaction type */
  trigger?: 'click' | 'hover' | 'focus';
  /** Delay before showing paywall (hover/focus triggers) */
  delay?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
}

/**
 * Context value for PaywallProvider
 */
export interface PaywallContextValue {
  /** Show paywall with configuration */
  showPaywall: (props: PaywallProps) => void;
  /** Hide current paywall */
  hidePaywall: () => void;
  /** Current paywall state */
  currentPaywall: PaywallProps | null;
  /** Is any paywall currently visible */
  isVisible: boolean;
  /** User's current subscription level */
  userLevel: PaywallLevel;
  /** Update user's subscription level */
  setUserLevel: (level: PaywallLevel) => void;
  /** Check if feature is available for current user */
  hasAccess: (requiredLevel: PaywallLevel) => boolean;
  /** Check specific feature access */
  checkFeatureAccess: (feature: FeatureGate) => boolean;
}

/**
 * Utility type for paywall component variants using class-variance-authority
 */
export type PaywallVariants = {
  variant: Record<PaywallVariant, string>;
  size: Record<'sm' | 'md' | 'lg' | 'xl', string>;
  level: Record<PaywallLevel, string>;
};

/**
 * Export utility types for external usage
 */
export type PaywallEventHandler = (event: any) => void;
export type PaywallStateUpdater = (state: any) => void;

/**
 * Default export for the main PaywallProps interface
 */
export default PaywallProps;