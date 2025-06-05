/**
 * @fileoverview Dialog component types adapted for React dialog patterns and Headless UI integration
 * 
 * This file provides comprehensive type definitions for dialog data structures and configurations
 * that complement the React 19/Next.js 15.1 dialog component system. It replaces Angular Material
 * dialog contracts with modern React patterns supporting Portal-based rendering, accessibility,
 * and enhanced state management.
 * 
 * Key Features:
 * - React Portal-based dialog rendering support
 * - WCAG 2.1 AA accessibility compliance with enhanced screen reader support
 * - Headless UI modal compatibility and integration patterns
 * - React state management integration with Zustand and React Query
 * - TypeScript 5.8+ enhanced type safety with strict inference
 * - Mobile-first responsive dialog data structures
 * - Promise-based async dialog workflows for modern React patterns
 * 
 * @author DreamFactory Admin Interface  
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import { ReactNode, ComponentType, RefObject } from 'react';

// =============================================================================
// CORE DIALOG DATA INTERFACES
// =============================================================================

/**
 * Enhanced ConfirmDialogData interface for React dialog components
 * Replaces Angular Material dialog data with React-optimized patterns
 */
export interface ConfirmDialogData {
  /** Dialog title with React element support */
  title: string | ReactNode;
  
  /** Main confirmation message content */
  message: string | ReactNode;
  
  /** Optional detailed description or additional context */
  description?: string | ReactNode;
  
  /** Confirm button configuration */
  confirm: {
    /** Button text */
    text: string;
    /** Button variant for styling */
    variant?: 'default' | 'primary' | 'destructive' | 'success' | 'warning';
    /** Loading state during confirmation */
    loading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Icon component to display */
    icon?: ComponentType<{ className?: string }>;
    /** Accessibility label */
    ariaLabel?: string;
  };
  
  /** Cancel button configuration */
  cancel: {
    /** Button text */
    text: string;
    /** Button variant for styling */
    variant?: 'ghost' | 'outline' | 'secondary';
    /** Disabled state */
    disabled?: boolean;
    /** Icon component to display */
    icon?: ComponentType<{ className?: string }>;
    /** Accessibility label */
    ariaLabel?: string;
  };
  
  /** Dialog appearance and behavior */
  appearance?: {
    /** Dialog size */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Whether the action is destructive */
    destructive?: boolean;
    /** Show warning icon */
    showIcon?: boolean;
    /** Custom icon component */
    customIcon?: ComponentType<{ className?: string }>;
    /** Icon color theme */
    iconColor?: 'info' | 'warning' | 'error' | 'success';
  };
  
  /** Advanced confirmation requirements */
  verification?: {
    /** Require typing confirmation text */
    requireText?: {
      enabled: boolean;
      text: string;
      placeholder?: string;
      caseSensitive?: boolean;
    };
    /** Require checkbox confirmation */
    requireCheckbox?: {
      enabled: boolean;
      text: string | ReactNode;
      required: boolean;
    };
    /** Countdown timer before confirm is enabled */
    countdown?: {
      enabled: boolean;
      seconds: number;
      message?: string;
    };
  };
  
  /** Accessibility enhancements */
  accessibility?: {
    /** Announce to screen readers when opened */
    announceOnOpen?: string;
    /** Announce when action is destructive */
    destructiveWarning?: string;
    /** Focus element after confirmation */
    focusAfterConfirm?: string | HTMLElement;
    /** Focus element after cancellation */
    focusAfterCancel?: string | HTMLElement;
  };
  
  /** Data payload to pass through the dialog */
  data?: unknown;
  
  /** Context information for tracking */
  context?: {
    /** Source component or page */
    source?: string;
    /** Action being confirmed */
    action?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
  };
}

// =============================================================================
// REACT PORTAL DIALOG INTERFACES
// =============================================================================

/**
 * Portal-based dialog rendering configuration
 * Enables flexible dialog rendering across React component trees
 */
export interface DialogPortalConfig {
  /** Portal container element or selector */
  container?: HTMLElement | string | null;
  
  /** Whether to create container if it doesn't exist */
  createContainer?: boolean;
  
  /** Container creation configuration */
  containerConfig?: {
    /** Container element tag name */
    tagName?: string;
    /** Container CSS classes */
    className?: string;
    /** Container inline styles */
    style?: React.CSSProperties;
    /** Container ARIA attributes */
    ariaAttributes?: Record<string, string>;
  };
  
  /** Z-index management */
  zIndex?: {
    /** Base z-index for layering */
    base?: number;
    /** Auto-increment for stacked dialogs */
    autoIncrement?: boolean;
    /** Maximum z-index value */
    max?: number;
  };
  
  /** Portal cleanup behavior */
  cleanup?: {
    /** Remove container on unmount */
    removeContainer?: boolean;
    /** Cleanup delay in milliseconds */
    delay?: number;
    /** Force cleanup on page unload */
    forceCleanup?: boolean;
  };
}

/**
 * React Portal dialog rendering data
 * Comprehensive configuration for Portal-based dialog systems
 */
export interface PortalDialogData {
  /** Unique identifier for the dialog instance */
  id: string;
  
  /** Portal configuration */
  portal: DialogPortalConfig;
  
  /** Dialog content component or element */
  content: ReactNode | ComponentType<any>;
  
  /** Props to pass to content component */
  contentProps?: Record<string, unknown>;
  
  /** Portal-specific accessibility settings */
  accessibility: {
    /** Focus management across portals */
    focusManagement: {
      /** Trap focus within portal */
      trapFocus: boolean;
      /** Restore focus on close */
      restoreFocus: boolean;
      /** Initial focus target */
      initialFocus?: string | HTMLElement | RefObject<HTMLElement>;
      /** Final focus target */
      finalFocus?: string | HTMLElement | RefObject<HTMLElement>;
    };
    
    /** Screen reader announcements */
    announcements: {
      /** Announce when portal opens */
      onOpen?: string;
      /** Announce when portal closes */
      onClose?: string;
      /** Live region for dynamic updates */
      liveRegion?: 'polite' | 'assertive' | 'off';
    };
    
    /** Keyboard navigation */
    keyboard: {
      /** Close on escape key */
      escapeToClose: boolean;
      /** Prevent background interaction */
      preventBackgroundInteraction: boolean;
      /** Enable tab cycling */
      enableTabCycling: boolean;
    };
  };
  
  /** Portal lifecycle callbacks */
  lifecycle?: {
    /** Called before portal mounts */
    beforeMount?: () => void | Promise<void>;
    /** Called after portal mounts */
    afterMount?: () => void | Promise<void>;
    /** Called before portal unmounts */
    beforeUnmount?: () => void | Promise<void>;
    /** Called after portal unmounts */
    afterUnmount?: () => void | Promise<void>;
  };
}

// =============================================================================
// REACT STATE MANAGEMENT INTEGRATION
// =============================================================================

/**
 * Dialog state management configuration for React patterns
 * Integrates with Zustand, React Query, and local component state
 */
export interface DialogStateConfig {
  /** State management strategy */
  strategy: 'local' | 'zustand' | 'context' | 'reducer' | 'external';
  
  /** Local state configuration */
  local?: {
    /** Initial open state */
    initialOpen?: boolean;
    /** Persist state in sessionStorage */
    persist?: boolean;
    /** Storage key for persistence */
    storageKey?: string;
  };
  
  /** Zustand store integration */
  zustand?: {
    /** Store selector function */
    selector?: (state: any) => any;
    /** State update function */
    updater?: (state: any, action: any) => any;
    /** Store subscription options */
    subscription?: {
      /** Subscribe to specific slice */
      slice?: string;
      /** Equality function for re-renders */
      equalityFn?: (a: any, b: any) => boolean;
    };
  };
  
  /** React Context integration */
  context?: {
    /** Context provider reference */
    provider?: React.Context<any>;
    /** Context value selector */
    selector?: (contextValue: any) => any;
    /** Default context value */
    defaultValue?: any;
  };
  
  /** External state integration */
  external?: {
    /** Get current state */
    getValue: () => any;
    /** Set state value */
    setValue: (value: any) => void;
    /** Subscribe to state changes */
    subscribe?: (callback: (value: any) => void) => () => void;
  };
  
  /** State synchronization */
  sync?: {
    /** Debounce state updates */
    debounce?: number;
    /** Throttle state updates */
    throttle?: number;
    /** Sync with URL parameters */
    urlSync?: {
      enabled: boolean;
      paramName?: string;
      serialize?: (value: any) => string;
      deserialize?: (value: string) => any;
    };
  };
}

/**
 * Dialog context data for React component tree integration
 * Enables dialog state sharing across component hierarchies
 */
export interface DialogContextData {
  /** Dialog registry for managing multiple dialogs */
  registry: {
    /** Active dialog instances */
    active: Map<string, DialogInstance>;
    /** Dialog stack for layering */
    stack: string[];
    /** Maximum concurrent dialogs */
    maxConcurrent?: number;
  };
  
  /** Global dialog configuration */
  config: {
    /** Default portal container */
    defaultContainer?: HTMLElement | string;
    /** Default z-index base */
    defaultZIndex?: number;
    /** Animation preferences */
    animations?: {
      enabled: boolean;
      duration: number;
      easing: string;
    };
    /** Accessibility defaults */
    accessibility?: {
      focusTrap: boolean;
      announceOnOpen: boolean;
      closeOnEscape: boolean;
    };
  };
  
  /** Event system for dialog coordination */
  events: {
    /** Event emitter for dialog events */
    emitter?: {
      emit: (event: string, data?: any) => void;
      on: (event: string, handler: (data?: any) => void) => () => void;
      off: (event: string, handler: (data?: any) => void) => void;
    };
    /** Global event handlers */
    handlers?: {
      onDialogOpen?: (dialog: DialogInstance) => void;
      onDialogClose?: (dialog: DialogInstance) => void;
      onDialogError?: (dialog: DialogInstance, error: Error) => void;
    };
  };
  
  /** Performance monitoring */
  performance?: {
    /** Track dialog render times */
    trackRenderTime?: boolean;
    /** Track memory usage */
    trackMemory?: boolean;
    /** Performance thresholds */
    thresholds?: {
      renderTime?: number;
      memoryUsage?: number;
    };
  };
}

// =============================================================================
// HEADLESS UI MODAL INTEGRATION
// =============================================================================

/**
 * Headless UI modal compatibility configuration
 * Ensures seamless integration with Headless UI Dialog primitive
 */
export interface HeadlessUIDialogConfig {
  /** Headless UI Dialog.Panel configuration */
  panel: {
    /** Custom className for panel */
    className?: string;
    /** Panel click behavior */
    onClick?: (event: React.MouseEvent) => void;
    /** Panel keyboard behavior */
    onKeyDown?: (event: React.KeyboardEvent) => void;
    /** Panel focus behavior */
    onFocus?: (event: React.FocusEvent) => void;
  };
  
  /** Headless UI Dialog.Overlay configuration */
  overlay: {
    /** Custom className for overlay */
    className?: string;
    /** Overlay click behavior */
    onClick?: (event: React.MouseEvent) => void;
    /** Overlay opacity */
    opacity?: number;
    /** Overlay blur effect */
    blur?: boolean;
  };
  
  /** Headless UI Transition integration */
  transition: {
    /** Show transition */
    show?: {
      enter?: string;
      enterFrom?: string;
      enterTo?: string;
      leave?: string;
      leaveFrom?: string;
      leaveTo?: string;
    };
    /** Child transition */
    child?: {
      enter?: string;
      enterFrom?: string;
      enterTo?: string;
      leave?: string;
      leaveFrom?: string;
      leaveTo?: string;
    };
  };
  
  /** Focus management integration */
  focus: {
    /** Initial focus element */
    initialFocus?: RefObject<HTMLElement>;
    /** Restore focus */
    restoreFocus?: boolean;
    /** Focus trap enabled */
    trapFocus?: boolean;
  };
  
  /** Dialog state integration */
  state: {
    /** Open state */
    open: boolean;
    /** Open state change handler */
    onOpenChange: (open: boolean) => void;
    /** Close handler */
    onClose?: () => void;
  };
  
  /** Accessibility overrides */
  accessibility: {
    /** Custom aria-label */
    ariaLabel?: string;
    /** Custom aria-labelledby */
    ariaLabelledBy?: string;
    /** Custom aria-describedby */
    ariaDescribedBy?: string;
    /** Custom role */
    role?: string;
  };
}

// =============================================================================
// DIALOG WORKFLOW INTERFACES
// =============================================================================

/**
 * Dialog instance tracking and management
 * Provides runtime information about active dialog instances
 */
export interface DialogInstance {
  /** Unique instance identifier */
  id: string;
  
  /** Dialog type */
  type: 'confirm' | 'prompt' | 'alert' | 'custom';
  
  /** Dialog data configuration */
  data: ConfirmDialogData | PromptDialogData | AlertDialogData | CustomDialogData;
  
  /** Current state */
  state: {
    /** Whether dialog is open */
    open: boolean;
    /** Loading state */
    loading: boolean;
    /** Error state */
    error?: {
      message: string;
      code?: string;
      recoverable: boolean;
    };
    /** Resolution state */
    resolved: boolean;
    /** Resolution result */
    result?: DialogResult;
  };
  
  /** Timing information */
  timing: {
    /** Creation timestamp */
    created: number;
    /** Opened timestamp */
    opened?: number;
    /** Closed timestamp */
    closed?: number;
    /** Total duration */
    duration?: number;
  };
  
  /** Portal information */
  portal: {
    /** Portal container */
    container: HTMLElement;
    /** Z-index value */
    zIndex: number;
    /** Cleanup function */
    cleanup?: () => void;
  };
  
  /** Accessibility state */
  accessibility: {
    /** Focus trap active */
    focusTrapActive: boolean;
    /** Previously focused element */
    previouslyFocused?: HTMLElement;
    /** Screen reader announced */
    announced: boolean;
  };
}

/**
 * Dialog result with enhanced metadata
 * Provides comprehensive information about dialog resolution
 */
export interface DialogResult<T = unknown> {
  /** Whether dialog was confirmed */
  confirmed: boolean;
  
  /** Result data */
  data?: T;
  
  /** How dialog was closed */
  reason: 'confirm' | 'cancel' | 'escape' | 'outside-click' | 'programmatic' | 'error';
  
  /** Timing information */
  timing: {
    /** When dialog was opened */
    opened: number;
    /** When dialog was closed */
    closed: number;
    /** Total interaction duration */
    duration: number;
    /** Time to first interaction */
    timeToInteraction?: number;
  };
  
  /** User interaction metadata */
  interaction: {
    /** Number of focus changes */
    focusChanges: number;
    /** Keyboard interactions */
    keyboardInteractions: number;
    /** Mouse interactions */
    mouseInteractions: number;
    /** Touch interactions */
    touchInteractions: number;
  };
  
  /** Accessibility metrics */
  accessibility: {
    /** Screen reader usage detected */
    screenReaderUsed: boolean;
    /** Keyboard navigation used */
    keyboardNavigation: boolean;
    /** High contrast mode detected */
    highContrastMode: boolean;
    /** Reduced motion preference */
    reducedMotion: boolean;
  };
  
  /** Error information if applicable */
  error?: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Stack trace */
    stack?: string;
    /** Recovery attempted */
    recoveryAttempted: boolean;
  };
}

// =============================================================================
// SPECIALIZED DIALOG DATA TYPES
// =============================================================================

/**
 * Prompt dialog data for user input collection
 */
export interface PromptDialogData {
  /** Dialog title */
  title: string | ReactNode;
  
  /** Prompt message */
  message?: string | ReactNode;
  
  /** Input configuration */
  input: {
    /** Input type */
    type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'multiselect';
    /** Input placeholder */
    placeholder?: string;
    /** Default value */
    defaultValue?: string;
    /** Input label */
    label?: string;
    /** Help text */
    helpText?: string;
    /** Required field indicator */
    required?: boolean;
    /** Input options for select types */
    options?: Array<{
      value: string | number;
      label: string;
      disabled?: boolean;
    }>;
  };
  
  /** Validation configuration */
  validation?: {
    /** Required validation */
    required?: boolean;
    /** Minimum length */
    minLength?: number;
    /** Maximum length */
    maxLength?: number;
    /** Pattern validation */
    pattern?: RegExp;
    /** Custom validator function */
    validator?: (value: string) => string | null;
    /** Real-time validation */
    realTime?: boolean;
  };
  
  /** Button configuration */
  buttons: {
    /** Submit button */
    submit: {
      text: string;
      variant?: 'primary' | 'secondary' | 'success';
      disabled?: boolean;
    };
    /** Cancel button */
    cancel: {
      text: string;
      variant?: 'ghost' | 'outline';
      disabled?: boolean;
    };
  };
  
  /** Additional configuration */
  config?: {
    /** Allow empty submission */
    allowEmpty?: boolean;
    /** Auto-focus input */
    autoFocus?: boolean;
    /** Select all text on focus */
    selectAllOnFocus?: boolean;
    /** Submit on Enter key */
    submitOnEnter?: boolean;
  };
}

/**
 * Alert dialog data for notifications
 */
export interface AlertDialogData {
  /** Alert title */
  title: string | ReactNode;
  
  /** Alert message */
  message: string | ReactNode;
  
  /** Alert type */
  type: 'info' | 'success' | 'warning' | 'error';
  
  /** Alert icon configuration */
  icon?: {
    /** Show default icon for type */
    show: boolean;
    /** Custom icon component */
    custom?: ComponentType<{ className?: string }>;
    /** Icon position */
    position?: 'left' | 'top';
  };
  
  /** Action button configuration */
  action: {
    /** Button text */
    text: string;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'ghost';
    /** Auto-close after action */
    autoClose?: boolean;
  };
  
  /** Auto-dismiss configuration */
  autoDismiss?: {
    /** Enable auto-dismiss */
    enabled: boolean;
    /** Dismiss timeout in milliseconds */
    timeout: number;
    /** Show countdown */
    showCountdown?: boolean;
    /** Pause on hover */
    pauseOnHover?: boolean;
  };
}

/**
 * Custom dialog data for specialized use cases
 */
export interface CustomDialogData {
  /** Dialog identifier */
  id: string;
  
  /** Custom content component */
  content: ComponentType<any>;
  
  /** Props to pass to content component */
  contentProps?: Record<string, unknown>;
  
  /** Dialog configuration */
  config: {
    /** Dialog title */
    title?: string | ReactNode;
    /** Dialog size */
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    /** Close behavior */
    closeBehavior?: {
      /** Show close button */
      showCloseButton: boolean;
      /** Close on outside click */
      closeOnOutsideClick: boolean;
      /** Close on escape */
      closeOnEscape: boolean;
    };
    /** Scrollable content */
    scrollable?: boolean;
    /** Modal behavior */
    modal?: boolean;
  };
  
  /** Event handlers */
  handlers?: {
    /** Custom close handler */
    onClose?: () => void | Promise<void>;
    /** Content ready handler */
    onContentReady?: () => void;
    /** Error handler */
    onError?: (error: Error) => void;
  };
  
  /** Data payload */
  payload?: unknown;
}

// =============================================================================
// ACCESSIBILITY ENHANCEMENT INTERFACES
// =============================================================================

/**
 * Enhanced accessibility configuration for React dialog patterns
 * Extends WCAG 2.1 AA compliance with React-specific enhancements
 */
export interface DialogAccessibilityConfig {
  /** Screen reader optimizations */
  screenReader: {
    /** Announce dialog content changes */
    announceDynamicContent: boolean;
    /** Live region configuration */
    liveRegion: {
      /** Politeness level */
      politeness: 'polite' | 'assertive' | 'off';
      /** Atomic announcements */
      atomic: boolean;
      /** Relevant changes to announce */
      relevant: 'additions' | 'removals' | 'text' | 'all';
    };
    /** Reading flow optimization */
    readingFlow: {
      /** Optimize heading structure */
      optimizeHeadings: boolean;
      /** Skip repeated content */
      skipRepeatedContent: boolean;
      /** Provide content summary */
      provideSummary: boolean;
    };
  };
  
  /** Motor accessibility */
  motor: {
    /** Large touch targets */
    largeTouchTargets: boolean;
    /** Minimum touch target size */
    minTouchTargetSize: number;
    /** Click target spacing */
    targetSpacing: number;
    /** Gesture alternatives */
    gestureAlternatives: boolean;
  };
  
  /** Cognitive accessibility */
  cognitive: {
    /** Clear language mode */
    clearLanguage: boolean;
    /** Progress indicators */
    showProgress: boolean;
    /** Error prevention */
    errorPrevention: boolean;
    /** Context help */
    contextHelp: boolean;
    /** Timeout warnings */
    timeoutWarnings: boolean;
  };
  
  /** Visual accessibility */
  visual: {
    /** High contrast support */
    highContrast: boolean;
    /** Color blind support */
    colorBlindSupport: boolean;
    /** Font size scaling */
    fontSizeScaling: boolean;
    /** Motion sensitivity */
    motionSensitivity: {
      /** Respect reduced motion */
      respectReducedMotion: boolean;
      /** Alternative animations */
      alternativeAnimations: boolean;
      /** Disable parallax */
      disableParallax: boolean;
    };
  };
}

// =============================================================================
// PERFORMANCE AND OPTIMIZATION INTERFACES
// =============================================================================

/**
 * Dialog performance optimization configuration
 * Enables efficient rendering and resource management
 */
export interface DialogPerformanceConfig {
  /** Lazy loading configuration */
  lazyLoading: {
    /** Enable lazy loading */
    enabled: boolean;
    /** Loading threshold */
    threshold: number;
    /** Preload strategy */
    preload: 'none' | 'metadata' | 'auto';
  };
  
  /** Virtualization for large content */
  virtualization: {
    /** Enable virtualization */
    enabled: boolean;
    /** Item height estimation */
    estimatedItemHeight: number;
    /** Overscan count */
    overscanCount: number;
  };
  
  /** Memory management */
  memory: {
    /** Cleanup on unmount */
    cleanupOnUnmount: boolean;
    /** Memory usage threshold */
    memoryThreshold: number;
    /** Garbage collection hints */
    gcHints: boolean;
  };
  
  /** Rendering optimizations */
  rendering: {
    /** Use React concurrent features */
    useConcurrentFeatures: boolean;
    /** Debounce re-renders */
    debounceRenders: number;
    /** Batch state updates */
    batchStateUpdates: boolean;
  };
}

// =============================================================================
// TYPE EXPORTS AND UTILITIES
// =============================================================================

/**
 * Union type for all dialog data types
 */
export type AnyDialogData = 
  | ConfirmDialogData 
  | PromptDialogData 
  | AlertDialogData 
  | CustomDialogData;

/**
 * Dialog data type discriminator
 */
export type DialogDataType<T extends AnyDialogData> = 
  T extends ConfirmDialogData ? 'confirm' :
  T extends PromptDialogData ? 'prompt' :
  T extends AlertDialogData ? 'alert' :
  T extends CustomDialogData ? 'custom' :
  never;

/**
 * Extract dialog result type from dialog data
 */
export type ExtractDialogResult<T extends AnyDialogData> =
  T extends ConfirmDialogData ? DialogResult<boolean> :
  T extends PromptDialogData ? DialogResult<string> :
  T extends AlertDialogData ? DialogResult<void> :
  T extends CustomDialogData ? DialogResult<unknown> :
  DialogResult<unknown>;

/**
 * Type-safe dialog creator function type
 */
export type DialogCreator<T extends AnyDialogData> = (
  data: T
) => Promise<ExtractDialogResult<T>>;

/**
 * Dialog event types for type-safe event handling
 */
export interface DialogEvents {
  'dialog:open': { instance: DialogInstance };
  'dialog:close': { instance: DialogInstance; result: DialogResult };
  'dialog:error': { instance: DialogInstance; error: Error };
  'dialog:focus-change': { instance: DialogInstance; element: HTMLElement };
  'dialog:state-change': { instance: DialogInstance; state: any };
}

/**
 * Default configuration values
 */
export const DEFAULT_DIALOG_CONFIG = {
  portal: {
    container: 'body',
    createContainer: false,
    zIndex: { base: 1000, autoIncrement: true, max: 9999 },
    cleanup: { removeContainer: false, delay: 0, forceCleanup: true }
  },
  accessibility: {
    focusTrap: true,
    restoreFocus: true,
    announceOnOpen: true,
    closeOnEscape: true,
    preventBackgroundInteraction: true
  },
  performance: {
    lazyLoading: { enabled: true, threshold: 0.1, preload: 'metadata' },
    memory: { cleanupOnUnmount: true, memoryThreshold: 50, gcHints: true },
    rendering: { useConcurrentFeatures: true, debounceRenders: 16, batchStateUpdates: true }
  }
} as const;