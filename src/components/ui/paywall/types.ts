/**
 * TypeScript Type Definitions for Paywall Component System
 * 
 * Comprehensive type definitions for the React paywall component replacing Angular
 * DfPaywallComponent. Supports Calendly widget integration, internationalization,
 * responsive design, and WCAG 2.1 AA accessibility compliance.
 * 
 * @fileoverview Paywall component types for DreamFactory Admin Interface React migration
 * @version 1.0.0
 * @requires React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { ReactNode, ComponentPropsWithoutRef, RefObject } from 'react';
import { BaseComponent, ComponentVariant, ComponentSize, ResponsiveValue } from '@/types/ui';

// ============================================================================
// CORE PAYWALL COMPONENT TYPES
// ============================================================================

/**
 * Main paywall component props interface
 * Replaces Angular @Input/@Output decorators with React props pattern
 */
export interface PaywallProps extends BaseComponent {
  /** Optional CSS class name for custom styling */
  className?: string;
  
  /** Custom inline styles with Tailwind CSS compatibility */
  style?: React.CSSProperties;
  
  /** Component variant for different styling themes */
  variant?: PaywallVariant;
  
  /** Component size for responsive design */
  size?: ComponentSize;
  
  /** Custom content to display above the default paywall content */
  headerContent?: ReactNode;
  
  /** Custom content to display below the default paywall content */
  footerContent?: ReactNode;
  
  /** Whether to display the contact information section */
  showContactInfo?: boolean;
  
  /** Whether to display the Calendly widget */
  showCalendlyWidget?: boolean;
  
  /** Custom Calendly configuration */
  calendlyConfig?: CalendlyConfig;
  
  /** Custom styling for the paywall container */
  containerClassName?: string;
  
  /** Custom styling for the Calendly widget container */
  widgetClassName?: string;
  
  /** Responsive breakpoint configurations */
  responsive?: ResponsiveValue<PaywallLayout>;
  
  /** Loading state configuration */
  loading?: boolean;
  
  /** Error state configuration */
  error?: string | null;
  
  /** Event handler for when the component mounts */
  onMount?: () => void;
  
  /** Event handler for when the Calendly widget loads */
  onCalendlyLoad?: () => void;
  
  /** Event handler for when the Calendly widget fails to load */
  onCalendlyError?: (error: Error) => void;
  
  /** Event handler for Calendly widget events */
  onCalendlyEvent?: (event: CalendlyEvent) => void;
  
  // WCAG 2.1 AA Accessibility Props
  /** ARIA label for screen readers */
  'aria-label'?: string;
  
  /** ARIA description for additional context */
  'aria-describedby'?: string;
  
  /** ARIA labelledby for referencing labeling elements */
  'aria-labelledby'?: string;
  
  /** ARIA role for semantic meaning */
  role?: 'main' | 'section' | 'region' | 'complementary';
  
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  
  /** Whether the component should auto-focus on mount */
  autoFocus?: boolean;
  
  // Internationalization Support (react-i18next)
  /** Override default translation namespace */
  translationNamespace?: string;
  
  /** Custom translation keys for text content */
  translations?: PaywallTranslationKeys;
  
  /** Language code for localization */
  locale?: string;
}

/**
 * Paywall component variant types for different use cases
 */
export type PaywallVariant = 
  | 'default'      // Standard paywall display
  | 'enterprise'   // Enterprise-focused messaging
  | 'trial'        // Free trial promotion
  | 'feature'      // Feature-specific paywall
  | 'minimal'      // Minimal design without extensive content
  | 'modal'        // Modal overlay variant
  | 'inline';      // Inline content variant

/**
 * Paywall layout configurations for responsive design
 */
export interface PaywallLayout {
  /** Number of columns for info sections */
  columns: 1 | 2 | 3;
  
  /** Layout direction */
  direction: 'column' | 'row';
  
  /** Content alignment */
  alignment: 'left' | 'center' | 'right';
  
  /** Spacing between sections */
  spacing: ComponentSize;
  
  /** Whether to stack elements vertically on mobile */
  stackOnMobile: boolean;
}

// ============================================================================
// PAYWALL REF INTERFACE
// ============================================================================

/**
 * Paywall component ref interface for forwardRef compatibility
 * Provides access to imperative methods and DOM elements
 */
export interface PaywallRef {
  /** Reference to the main paywall container element */
  containerRef: RefObject<HTMLDivElement>;
  
  /** Reference to the Calendly widget container element */
  calendlyRef: RefObject<HTMLDivElement>;
  
  /** Initialize the Calendly widget programmatically */
  initializeCalendly: () => Promise<void>;
  
  /** Destroy the Calendly widget */
  destroyCalendly: () => void;
  
  /** Refresh the Calendly widget */
  refreshCalendly: () => Promise<void>;
  
  /** Focus the paywall component for accessibility */
  focus: () => void;
  
  /** Scroll to the paywall component */
  scrollIntoView: (options?: ScrollIntoViewOptions) => void;
  
  /** Get the current Calendly widget state */
  getCalendlyState: () => CalendlyState;
  
  /** Update Calendly configuration dynamically */
  updateCalendlyConfig: (config: Partial<CalendlyConfig>) => Promise<void>;
}

// ============================================================================
// CALENDLY INTEGRATION TYPES
// ============================================================================

/**
 * Calendly widget configuration interface
 * Type-safe configuration for external Calendly service integration
 */
export interface CalendlyConfig {
  /** Calendly URL for the scheduling widget */
  url: string;
  
  /** Widget display mode */
  mode?: CalendlyMode;
  
  /** Widget height in pixels */
  height?: number;
  
  /** Widget minimum height in pixels */
  minHeight?: number;
  
  /** Widget maximum height in pixels */
  maxHeight?: number;
  
  /** Whether to hide event details */
  hideEventDetails?: boolean;
  
  /** Whether to hide event duration */
  hideEventDuration?: boolean;
  
  /** Whether to hide the page details */
  hidePageDetails?: boolean;
  
  /** Primary color for the widget */
  primaryColor?: string;
  
  /** Background color for the widget */
  backgroundColor?: string;
  
  /** Text color for the widget */
  textColor?: string;
  
  /** Whether to auto-load the widget */
  autoLoad?: boolean;
  
  /** Prefill data for the widget */
  prefill?: CalendlyPrefill;
  
  /** UTM parameters for tracking */
  utm?: CalendlyUTM;
  
  /** Custom styles for the widget iframe */
  styles?: CalendlyStyles;
  
  /** Loading timeout in milliseconds */
  loadTimeout?: number;
  
  /** Retry attempts for failed loads */
  retryAttempts?: number;
  
  /** Custom event handlers */
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onEventScheduled?: (event: CalendlyScheduledEvent) => void;
  onEventCancelled?: (event: CalendlyEvent) => void;
  onDateAndTimeSelected?: (event: CalendlyEvent) => void;
  onProfilePageViewed?: (event: CalendlyEvent) => void;
  onEventTypeViewed?: (event: CalendlyEvent) => void;
}

/**
 * Calendly widget display modes
 */
export type CalendlyMode = 
  | 'inline'     // Embedded inline widget
  | 'popup'      // Popup modal widget
  | 'overlay'    // Full-screen overlay
  | 'redirect';  // Redirect to Calendly site

/**
 * Calendly prefill data for form fields
 */
export interface CalendlyPrefill {
  /** Prefill name field */
  name?: string;
  
  /** Prefill email field */
  email?: string;
  
  /** Prefill first name field */
  firstName?: string;
  
  /** Prefill last name field */
  lastName?: string;
  
  /** Prefill phone number field */
  phone?: string;
  
  /** Prefill custom question answers */
  customAnswers?: Record<string, string>;
  
  /** Prefill guests array */
  guests?: string[];
  
  /** Prefill date and time */
  date?: string;
  
  /** Prefill timezone */
  timezone?: string;
}

/**
 * Calendly UTM tracking parameters
 */
export interface CalendlyUTM {
  /** UTM source parameter */
  source?: string;
  
  /** UTM medium parameter */
  medium?: string;
  
  /** UTM campaign parameter */
  campaign?: string;
  
  /** UTM term parameter */
  term?: string;
  
  /** UTM content parameter */
  content?: string;
  
  /** Sales force ID for CRM integration */
  salesforceId?: string;
}

/**
 * Calendly widget custom styles
 */
export interface CalendlyStyles {
  /** Custom CSS for the widget container */
  container?: React.CSSProperties;
  
  /** Custom CSS for the iframe */
  iframe?: React.CSSProperties;
  
  /** Custom CSS for loading state */
  loading?: React.CSSProperties;
  
  /** Custom CSS for error state */
  error?: React.CSSProperties;
}

/**
 * Calendly widget state tracking
 */
export interface CalendlyState {
  /** Whether the widget is currently loading */
  loading: boolean;
  
  /** Whether the widget has loaded successfully */
  loaded: boolean;
  
  /** Current error state, if any */
  error: Error | null;
  
  /** Whether the widget is visible */
  visible: boolean;
  
  /** Current widget height */
  height: number;
  
  /** Last load timestamp */
  lastLoaded: number | null;
  
  /** Number of load attempts */
  loadAttempts: number;
}

/**
 * Calendly event data structure
 */
export interface CalendlyEvent {
  /** Event type identifier */
  type: CalendlyEventType;
  
  /** Event timestamp */
  timestamp: number;
  
  /** Event data payload */
  data?: Record<string, any>;
  
  /** Event source widget ID */
  source?: string;
}

/**
 * Calendly scheduled event data
 */
export interface CalendlyScheduledEvent extends CalendlyEvent {
  /** Scheduled event details */
  event: {
    /** Event UUID */
    uuid: string;
    
    /** Event name */
    name: string;
    
    /** Scheduled start time */
    startTime: string;
    
    /** Scheduled end time */
    endTime: string;
    
    /** Invitee information */
    invitee: {
      uuid: string;
      name: string;
      email: string;
      phone?: string;
    };
    
    /** Event location */
    location?: {
      type: string;
      location?: string;
    };
  };
}

/**
 * Calendly event types for widget interactions
 */
export type CalendlyEventType =
  | 'profile_page_viewed'
  | 'event_type_viewed'
  | 'date_and_time_selected'
  | 'event_scheduled'
  | 'event_cancelled'
  | 'widget_loaded'
  | 'widget_error'
  | 'height_changed';

// ============================================================================
// INTERNATIONALIZATION TYPES
// ============================================================================

/**
 * Translation keys for react-i18next integration
 * Replaces Angular Transloco with React i18next patterns
 */
export interface PaywallTranslationKeys {
  /** Main header text */
  header?: string;
  
  /** Secondary header text */
  subheader?: string;
  
  /** Hosted trial section title */
  hostedTrialTitle?: string;
  
  /** Hosted trial section content */
  hostedTrialContent?: string;
  
  /** Learn more section title */
  learnMoreTitle?: string;
  
  /** Learn more section content */
  learnMoreContent?: string;
  
  /** Speak to human section title */
  speakToHumanTitle?: string;
  
  /** Phone label text */
  phoneLabel?: string;
  
  /** Email label text */
  emailLabel?: string;
  
  /** Loading message */
  loadingMessage?: string;
  
  /** Error message */
  errorMessage?: string;
  
  /** Calendly loading message */
  calendlyLoadingMessage?: string;
  
  /** Calendly error message */
  calendlyErrorMessage?: string;
  
  /** Screen reader description */
  screenReaderDescription?: string;
  
  /** Contact information section label */
  contactInfoLabel?: string;
  
  /** Widget container label */
  widgetContainerLabel?: string;
}

/**
 * Default translation namespace for the paywall component
 */
export const PAYWALL_TRANSLATION_NAMESPACE = 'paywall' as const;

/**
 * Default translation keys with fallback values
 */
export const DEFAULT_PAYWALL_TRANSLATIONS: Required<PaywallTranslationKeys> = {
  header: 'paywall.header',
  subheader: 'paywall.subheader',
  hostedTrialTitle: 'paywall.hostedTrial',
  hostedTrialContent: 'paywall.bookTime',
  learnMoreTitle: 'paywall.learnMoreTitle',
  learnMoreContent: 'paywall.gain',
  speakToHumanTitle: 'paywall.speakToHuman',
  phoneLabel: 'phone',
  emailLabel: 'email',
  loadingMessage: 'Loading...',
  errorMessage: 'An error occurred. Please try again.',
  calendlyLoadingMessage: 'Loading scheduling widget...',
  calendlyErrorMessage: 'Failed to load scheduling widget. Please refresh the page.',
  screenReaderDescription: 'Paywall content with scheduling options',
  contactInfoLabel: 'Contact Information',
  widgetContainerLabel: 'Scheduling Widget',
} as const;

// ============================================================================
// RESPONSIVE DESIGN TYPES
// ============================================================================

/**
 * Responsive design configuration for paywall layout
 */
export interface PaywallResponsiveConfig {
  /** Breakpoint-specific layout configurations */
  breakpoints: {
    xs?: Partial<PaywallLayout>;
    sm?: Partial<PaywallLayout>;
    md?: Partial<PaywallLayout>;
    lg?: Partial<PaywallLayout>;
    xl?: Partial<PaywallLayout>;
    '2xl'?: Partial<PaywallLayout>;
  };
  
  /** Default layout configuration */
  default: PaywallLayout;
  
  /** Whether to enable responsive behavior */
  enabled: boolean;
}

/**
 * Default responsive configuration following Tailwind CSS breakpoints
 */
export const DEFAULT_RESPONSIVE_CONFIG: PaywallResponsiveConfig = {
  breakpoints: {
    xs: {
      columns: 1,
      direction: 'column',
      alignment: 'center',
      stackOnMobile: true,
    },
    sm: {
      columns: 1,
      direction: 'column',
      alignment: 'center',
    },
    md: {
      columns: 2,
      direction: 'row',
      alignment: 'center',
    },
    lg: {
      columns: 2,
      direction: 'row',
      alignment: 'center',
    },
    xl: {
      columns: 2,
      direction: 'row',
      alignment: 'center',
    },
  },
  default: {
    columns: 2,
    direction: 'row',
    alignment: 'center',
    spacing: 'lg',
    stackOnMobile: true,
  },
  enabled: true,
} as const;

// ============================================================================
// LOADING AND ERROR STATE TYPES
// ============================================================================

/**
 * Loading state configuration for async operations
 */
export interface PaywallLoadingState {
  /** Whether the component is loading */
  loading: boolean;
  
  /** Loading message to display */
  message?: string;
  
  /** Whether to show a loading spinner */
  showSpinner?: boolean;
  
  /** Custom loading component */
  loadingComponent?: ReactNode;
  
  /** Loading timeout in milliseconds */
  timeout?: number;
}

/**
 * Error state configuration for error handling
 */
export interface PaywallErrorState {
  /** Error object or message */
  error: Error | string | null;
  
  /** Whether the error is recoverable */
  recoverable?: boolean;
  
  /** Error message override */
  message?: string;
  
  /** Custom error component */
  errorComponent?: ReactNode;
  
  /** Error action handlers */
  onRetry?: () => void;
  onDismiss?: () => void;
  
  /** Whether to show error details */
  showDetails?: boolean;
}

// ============================================================================
// COMPONENT COMPOSITION TYPES
// ============================================================================

/**
 * Paywall component composition props for compound components
 */
export interface PaywallCompositionProps {
  /** Header section props */
  header?: PaywallHeaderProps;
  
  /** Content section props */
  content?: PaywallContentProps;
  
  /** Widget section props */
  widget?: PaywallWidgetProps;
  
  /** Footer section props */
  footer?: PaywallFooterProps;
}

/**
 * Paywall header section props
 */
export interface PaywallHeaderProps extends ComponentPropsWithoutRef<'header'> {
  /** Header title */
  title?: ReactNode;
  
  /** Header subtitle */
  subtitle?: ReactNode;
  
  /** Custom header content */
  children?: ReactNode;
  
  /** Header variant */
  variant?: ComponentVariant;
  
  /** Header size */
  size?: ComponentSize;
}

/**
 * Paywall content section props
 */
export interface PaywallContentProps extends ComponentPropsWithoutRef<'section'> {
  /** Content columns */
  columns?: PaywallContentColumn[];
  
  /** Content layout */
  layout?: PaywallLayout;
  
  /** Custom content */
  children?: ReactNode;
}

/**
 * Paywall content column definition
 */
export interface PaywallContentColumn {
  /** Column identifier */
  id: string;
  
  /** Column title */
  title: ReactNode;
  
  /** Column content */
  content: ReactNode;
  
  /** Column icon */
  icon?: ReactNode;
  
  /** Column variant */
  variant?: ComponentVariant;
  
  /** Column custom props */
  props?: ComponentPropsWithoutRef<'div'>;
}

/**
 * Paywall widget section props
 */
export interface PaywallWidgetProps extends ComponentPropsWithoutRef<'section'> {
  /** Calendly configuration */
  calendlyConfig?: CalendlyConfig;
  
  /** Widget loading state */
  loading?: PaywallLoadingState;
  
  /** Widget error state */
  error?: PaywallErrorState;
  
  /** Custom widget content */
  children?: ReactNode;
}

/**
 * Paywall footer section props
 */
export interface PaywallFooterProps extends ComponentPropsWithoutRef<'footer'> {
  /** Contact information */
  contactInfo?: PaywallContactInfo;
  
  /** Custom footer content */
  children?: ReactNode;
  
  /** Footer variant */
  variant?: ComponentVariant;
}

/**
 * Contact information configuration
 */
export interface PaywallContactInfo {
  /** Phone number */
  phone?: string;
  
  /** Email address */
  email?: string;
  
  /** Additional contact methods */
  additional?: Array<{
    label: string;
    value: string;
    href?: string;
    icon?: ReactNode;
  }>;
  
  /** Whether to show contact info */
  enabled?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extract props type for the paywall component
 */
export type PaywallComponentProps = PaywallProps;

/**
 * Extract ref type for the paywall component
 */
export type PaywallComponentRef = PaywallRef;

/**
 * Paywall component with ref forwarding type
 */
export type PaywallWithRef = React.ForwardRefExoticComponent<
  PaywallProps & React.RefAttributes<PaywallRef>
>;

/**
 * Default export interface for the paywall types module
 */
export interface PaywallTypesConfig {
  /** Component prop types */
  props: PaywallComponentProps;
  
  /** Component ref types */
  ref: PaywallComponentRef;
  
  /** Calendly configuration types */
  calendly: CalendlyConfig;
  
  /** Translation key types */
  translations: PaywallTranslationKeys;
  
  /** Responsive configuration types */
  responsive: PaywallResponsiveConfig;
  
  /** Loading state types */
  loading: PaywallLoadingState;
  
  /** Error state types */
  error: PaywallErrorState;
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Type guard to check if a value is a valid PaywallVariant
 */
export const isPaywallVariant = (value: any): value is PaywallVariant => {
  const validVariants: PaywallVariant[] = [
    'default',
    'enterprise',
    'trial',
    'feature',
    'minimal',
    'modal',
    'inline',
  ];
  return typeof value === 'string' && validVariants.includes(value as PaywallVariant);
};

/**
 * Type guard to check if a value is a valid CalendlyMode
 */
export const isCalendlyMode = (value: any): value is CalendlyMode => {
  const validModes: CalendlyMode[] = ['inline', 'popup', 'overlay', 'redirect'];
  return typeof value === 'string' && validModes.includes(value as CalendlyMode);
};

/**
 * Type guard to check if a value is a valid CalendlyEventType
 */
export const isCalendlyEventType = (value: any): value is CalendlyEventType => {
  const validTypes: CalendlyEventType[] = [
    'profile_page_viewed',
    'event_type_viewed',
    'date_and_time_selected',
    'event_scheduled',
    'event_cancelled',
    'widget_loaded',
    'widget_error',
    'height_changed',
  ];
  return typeof value === 'string' && validTypes.includes(value as CalendlyEventType);
};