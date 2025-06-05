/**
 * @fileoverview Comprehensive TypeScript interface definitions for the dialog component system
 * 
 * Migrated from Angular dialog types to React 19/Next.js 15.1 compatible interfaces.
 * Provides type safety for all dialog variants, compound components, animations, 
 * accessibility configurations, and responsive behavior patterns.
 * 
 * Key Features:
 * - WCAG 2.1 AA accessibility compliance (Section 7.7.1)
 * - Mobile-first responsive design support (Section 7.7.3) 
 * - Tailwind CSS 4.1+ animation integration (Section 7.1.1)
 * - React 19 specific type patterns and ref handling
 * - Promise-based async dialog workflows
 * - TypeScript 5.8+ enhanced type safety
 * 
 * @author DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 */

import { ReactNode, ComponentPropsWithoutRef, ElementRef } from 'react';

// =============================================================================
// CORE ENUMS AND UNION TYPES
// =============================================================================

/**
 * Dialog variant types supporting different presentation patterns
 * Replaces Angular Material dialog types with React-specific variants
 */
export type DialogVariant = 'modal' | 'sheet' | 'overlay' | 'drawer';

/**
 * Dialog size configurations for responsive design
 * Implements mobile-first approach per Section 7.7.3
 */
export const DialogSize = {
  XS: 'xs',
  SM: 'sm', 
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  XXL: '2xl',
  FULL: 'full',
} as const;

export type DialogSizeType = typeof DialogSize[keyof typeof DialogSize];

/**
 * Dialog position options for different screen orientations
 * Supports mobile-first responsive positioning
 */
export const DialogPosition = {
  CENTER: 'center',
  TOP: 'top',
  BOTTOM: 'bottom',
  LEFT: 'left',
  RIGHT: 'right',
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
} as const;

export type DialogPositionType = typeof DialogPosition[keyof typeof DialogPosition];

/**
 * Animation timing configurations for Tailwind CSS transitions
 * Integrates with Section 7.1.1 animation system
 */
export const DialogAnimationTiming = {
  FAST: 'fast',
  NORMAL: 'normal', 
  SLOW: 'slow',
  CUSTOM: 'custom',
} as const;

export type DialogAnimationTimingType = typeof DialogAnimationTiming[keyof typeof DialogAnimationTiming];

// =============================================================================
// ACCESSIBILITY INTERFACES (WCAG 2.1 AA COMPLIANCE)
// =============================================================================

/**
 * Accessibility configuration interface for WCAG 2.1 AA compliance
 * Implements requirements from Section 7.7.1 for focus management and screen reader support
 */
export interface DialogA11yProps {
  /** Accessible label for screen readers - required for WCAG 2.1 AA */
  'aria-label'?: string;
  
  /** ID of element that labels the dialog */
  'aria-labelledby'?: string;
  
  /** ID of element that describes the dialog content */
  'aria-describedby'?: string;
  
  /** Indicates if the dialog is modal (restricts focus) */
  'aria-modal'?: boolean;
  
  /** Live region announcement level for dynamic content */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  
  /** Indicates if the dialog content is atomic for screen readers */
  'aria-atomic'?: boolean;
  
  /** Custom role override (default: 'dialog') */
  role?: 'dialog' | 'alertdialog' | 'presentation';
  
  /** Focus trap configuration for keyboard navigation */
  focusTrap?: {
    enabled: boolean;
    restoreFocus: boolean;
    autoFocus: boolean;
    initialFocus?: string | HTMLElement;
    finalFocus?: string | HTMLElement;
  };
  
  /** Keyboard navigation settings */
  keyboardNavigation?: {
    escapeToClose: boolean;
    enterToConfirm: boolean;
    tabCycling: boolean;
    arrowNavigation: boolean;
  };
  
  /** Screen reader announcements */
  announcements?: {
    onOpen?: string;
    onClose?: string;
    onError?: string;
    onSuccess?: string;
  };
}

// =============================================================================
// ANIMATION AND TRANSITION INTERFACES
// =============================================================================

/**
 * Animation configuration for smooth transitions using Tailwind CSS
 * Implements Section 7.1.1 animation system requirements
 */
export interface DialogAnimationConfig {
  /** Animation timing preset or custom duration */
  timing: DialogAnimationTimingType;
  
  /** Custom duration in milliseconds (when timing is 'custom') */
  customDuration?: number;
  
  /** Easing function for animations */
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  
  /** Custom cubic-bezier values */
  customEasing?: [number, number, number, number];
  
  /** Enable animations (can be disabled for accessibility) */
  enabled: boolean;
  
  /** Reduce motion support for accessibility */
  respectReducedMotion: boolean;
  
  /** Entry animation type */
  enter: {
    from: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
    to: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  };
  
  /** Exit animation type */
  exit: {
    from: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
    to: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  };
  
  /** Background overlay animation */
  backdrop?: {
    enter: 'fade-in' | 'none';
    exit: 'fade-out' | 'none';
  };
}

// =============================================================================
// RESPONSIVE DESIGN INTERFACES
// =============================================================================

/**
 * Mobile-responsive configuration types for different screen sizes
 * Implements Section 7.7.3 mobile-first responsive design approach
 */
export interface DialogResponsiveConfig {
  /** Responsive size configuration per breakpoint */
  sizes: {
    xs?: DialogSizeType;  // < 475px
    sm?: DialogSizeType;  // 640px+
    md?: DialogSizeType;  // 768px+
    lg?: DialogSizeType;  // 1024px+
    xl?: DialogSizeType;  // 1280px+
    '2xl'?: DialogSizeType; // 1536px+
  };
  
  /** Responsive position configuration */
  positions: {
    xs?: DialogPositionType;
    sm?: DialogPositionType;
    md?: DialogPositionType;
    lg?: DialogPositionType;
    xl?: DialogPositionType;
    '2xl'?: DialogPositionType;
  };
  
  /** Mobile-specific behavior */
  mobile: {
    /** Convert to fullscreen on mobile */
    fullscreenOnMobile: boolean;
    
    /** Enable swipe gestures for dismissal */
    swipeToClose: boolean;
    
    /** Touch target minimum size (44px per WCAG) */
    minTouchTarget: number;
    
    /** Safe area insets handling */
    respectSafeArea: boolean;
  };
  
  /** Tablet-specific adaptations */
  tablet: {
    /** Maintain modal behavior on tablets */
    keepModalBehavior: boolean;
    
    /** Adapt size for tablet portrait/landscape */
    adaptToOrientation: boolean;
  };
}

// =============================================================================
// COMPOUND COMPONENT INTERFACES
// =============================================================================

/**
 * Base dialog component props interface with variant support
 * Replaces Angular Material dialog configuration with React patterns
 */
export interface DialogProps extends ComponentPropsWithoutRef<'div'>, DialogA11yProps {
  /** Dialog variant type */
  variant?: DialogVariant;
  
  /** Dialog size configuration */
  size?: DialogSizeType;
  
  /** Dialog position */
  position?: DialogPositionType;
  
  /** Whether the dialog is open */
  open: boolean;
  
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  
  /** Dialog content */
  children: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Animation configuration */
  animation?: Partial<DialogAnimationConfig>;
  
  /** Responsive behavior configuration */
  responsive?: Partial<DialogResponsiveConfig>;
  
  /** Whether clicking outside closes the dialog */
  closeOnOutsideClick?: boolean;
  
  /** Whether pressing escape closes the dialog */
  closeOnEscape?: boolean;
  
  /** Custom z-index value */
  zIndex?: number;
  
  /** Portal container for rendering */
  container?: HTMLElement | string;
  
  /** Prevent body scroll when open */
  preventBodyScroll?: boolean;
  
  /** Loading state indicator */
  loading?: boolean;
  
  /** Error state configuration */
  error?: {
    show: boolean;
    message?: string;
    retry?: () => void;
  };
}

/**
 * Dialog content container props
 * Provides main content area with proper styling and accessibility
 */
export interface DialogContentProps extends ComponentPropsWithoutRef<'div'> {
  /** Content children */
  children: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Scrollable content area */
  scrollable?: boolean;
  
  /** Maximum height for scrollable content */
  maxHeight?: string | number;
  
  /** Padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Dialog header component props
 * Provides title area with close button and accessibility features
 */
export interface DialogHeaderProps extends ComponentPropsWithoutRef<'div'> {
  /** Header content */
  children: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Show close button */
  showCloseButton?: boolean;
  
  /** Close button aria-label */
  closeButtonLabel?: string;
  
  /** Header alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Sticky header behavior */
  sticky?: boolean;
}

/**
 * Dialog footer component props  
 * Provides action button area with proper spacing and accessibility
 */
export interface DialogFooterProps extends ComponentPropsWithoutRef<'div'> {
  /** Footer content */
  children: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Button alignment */
  align?: 'left' | 'center' | 'right' | 'between' | 'around';
  
  /** Sticky footer behavior */
  sticky?: boolean;
  
  /** Reverse button order on mobile */
  reverseOnMobile?: boolean;
}

/**
 * Dialog title component props
 * Semantic title component with proper heading levels
 */
export interface DialogTitleProps extends ComponentPropsWithoutRef<'h2'> {
  /** Title text */
  children: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Heading level (h1-h6) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  
  /** Visual size independent of semantic level */
  visualLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Dialog description component props
 * Accessible description text for screen readers
 */
export interface DialogDescriptionProps extends ComponentPropsWithoutRef<'p'> {
  /** Description text */
  children: ReactNode;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Text size variant */
  size?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// CONTEXT AND STATE MANAGEMENT
// =============================================================================

/**
 * Dialog context type for state management across compound components
 * Enables communication between dialog parts without prop drilling
 */
export interface DialogContextType {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Function to close the dialog */
  onClose: () => void;
  
  /** Dialog variant */
  variant: DialogVariant;
  
  /** Dialog size */
  size: DialogSizeType;
  
  /** Dialog position */
  position: DialogPositionType;
  
  /** Animation configuration */
  animation: DialogAnimationConfig;
  
  /** Responsive configuration */
  responsive: DialogResponsiveConfig;
  
  /** Accessibility properties */
  a11y: Required<DialogA11yProps>;
  
  /** Current breakpoint */
  currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  /** Mobile device detection */
  isMobile: boolean;
  
  /** Tablet device detection */
  isTablet: boolean;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error: {
    show: boolean;
    message?: string;
    retry?: () => void;
  };
  
  /** Dialog element refs */
  refs: {
    dialog: React.RefObject<HTMLDivElement>;
    content: React.RefObject<HTMLDivElement>;
    header: React.RefObject<HTMLDivElement>;
    footer: React.RefObject<HTMLDivElement>;
    backdrop: React.RefObject<HTMLDivElement>;
  };
}

// =============================================================================
// PROMISE-BASED API TYPES
// =============================================================================

/**
 * Promise-based dialog result types for async workflows
 * Replaces Angular's synchronous dialog patterns with React async patterns
 */
export interface DialogResult<T = unknown> {
  /** Whether the dialog was confirmed or cancelled */
  confirmed: boolean;
  
  /** Data returned from the dialog */
  data?: T;
  
  /** How the dialog was closed */
  reason: 'confirm' | 'cancel' | 'escape' | 'outside-click' | 'programmatic';
  
  /** Timestamp when dialog was closed */
  timestamp: number;
}

/**
 * Confirmation dialog specific props
 * Provides standardized confirmation patterns
 */
export interface ConfirmDialogProps extends Omit<DialogProps, 'children'> {
  /** Confirmation title */
  title: string;
  
  /** Confirmation message */
  message: ReactNode;
  
  /** Confirm button text */
  confirmText?: string;
  
  /** Cancel button text */
  cancelText?: string;
  
  /** Confirm button variant */
  confirmVariant?: 'default' | 'destructive' | 'success' | 'warning';
  
  /** Whether the action is destructive */
  destructive?: boolean;
  
  /** Async confirmation handler */
  onConfirm?: () => Promise<void> | void;
  
  /** Cancel handler */
  onCancel?: () => void;
  
  /** Loading state during confirmation */
  confirmLoading?: boolean;
  
  /** Additional confirmation requirement (typing text) */
  requireConfirmation?: {
    enabled: boolean;
    text: string;
    placeholder?: string;
  };
}

/**
 * Prompt dialog specific props for input collection
 * Enables user input within modal context
 */
export interface PromptDialogProps<T = string> extends Omit<DialogProps, 'children'> {
  /** Prompt title */
  title: string;
  
  /** Prompt message */
  message?: ReactNode;
  
  /** Input type */
  inputType?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  
  /** Input placeholder */
  placeholder?: string;
  
  /** Default input value */
  defaultValue?: string;
  
  /** Input validation */
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    validator?: (value: string) => string | null;
  };
  
  /** Submit handler with validation */
  onSubmit?: (value: T) => Promise<void> | void;
  
  /** Cancel handler */
  onCancel?: () => void;
  
  /** Submit button text */
  submitText?: string;
  
  /** Cancel button text */
  cancelText?: string;
}

// =============================================================================
// HOOK INTERFACES
// =============================================================================

/**
 * Dialog hook return type for imperative dialog management
 * Provides programmatic dialog control methods
 */
export interface UseDialogReturn {
  /** Open a dialog imperatively */
  openDialog: <T = unknown>(props: DialogProps) => Promise<DialogResult<T>>;
  
  /** Open a confirmation dialog */
  confirm: (props: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => Promise<DialogResult<boolean>>;
  
  /** Open a prompt dialog */
  prompt: <T = string>(props: Omit<PromptDialogProps<T>, 'open' | 'onOpenChange'>) => Promise<DialogResult<T>>;
  
  /** Close all open dialogs */
  closeAll: () => void;
  
  /** Get currently open dialogs */
  getOpenDialogs: () => DialogContextType[];
  
  /** Check if any dialog is open */
  hasOpenDialogs: boolean;
}

/**
 * Dialog state hook return type for component-based dialog management
 * Manages open/close state with proper TypeScript inference
 */
export interface UseDialogStateReturn {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Open the dialog */
  openDialog: () => void;
  
  /** Close the dialog */
  closeDialog: () => void;
  
  /** Toggle dialog open/close state */
  toggleDialog: () => void;
  
  /** Set dialog open state */
  setOpen: (open: boolean) => void;
}

// =============================================================================
// REF TYPES
// =============================================================================

/**
 * Dialog component ref types for React 19 compatibility
 * Provides proper ref forwarding and imperative methods
 */
export type DialogRef = ElementRef<'div'>;
export type DialogContentRef = ElementRef<'div'>;
export type DialogHeaderRef = ElementRef<'div'>;
export type DialogFooterRef = ElementRef<'div'>;
export type DialogTitleRef = ElementRef<'h2'>;
export type DialogDescriptionRef = ElementRef<'p'>;

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract dialog variant-specific props
 * Enables type-safe variant-specific configuration
 */
export type ExtractDialogProps<T extends DialogVariant> = T extends 'modal'
  ? DialogProps & { variant: 'modal' }
  : T extends 'sheet'
  ? DialogProps & { variant: 'sheet' }  
  : T extends 'overlay'
  ? DialogProps & { variant: 'overlay' }
  : T extends 'drawer'
  ? DialogProps & { variant: 'drawer' }
  : DialogProps;

/**
 * Dialog event handler types for type-safe event handling
 */
export interface DialogEventHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onOutsideClick?: (event: MouseEvent) => void;
  onFocusTrap?: (event: FocusEvent) => void;
}

/**
 * Dialog theme integration types for design system compatibility
 * Integrates with Section 7.7.1 design token system
 */
export interface DialogThemeConfig {
  /** Background colors by variant */
  backgrounds: Record<DialogVariant, string>;
  
  /** Border configurations */
  borders: Record<DialogVariant, string>;
  
  /** Shadow configurations */
  shadows: Record<DialogVariant, string>;
  
  /** Border radius values */
  borderRadius: Record<DialogSizeType, string>;
  
  /** Z-index layers */
  zIndex: {
    backdrop: number;
    dialog: number;
    header: number;
    footer: number;
  };
  
  /** Responsive breakpoints */
  breakpoints: Record<string, string>;
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default animation configuration optimized for performance
 */
export const DEFAULT_ANIMATION_CONFIG: DialogAnimationConfig = {
  timing: 'normal',
  easing: 'ease-out',
  enabled: true,
  respectReducedMotion: true,
  enter: {
    from: 'fade',
    to: 'fade',
  },
  exit: {
    from: 'fade', 
    to: 'fade',
  },
  backdrop: {
    enter: 'fade-in',
    exit: 'fade-out',
  },
};

/**
 * Default responsive configuration for mobile-first design
 */
export const DEFAULT_RESPONSIVE_CONFIG: DialogResponsiveConfig = {
  sizes: {
    xs: 'full',
    sm: 'md',
    md: 'lg',
    lg: 'xl',
    xl: 'xl',
    '2xl': '2xl',
  },
  positions: {
    xs: 'bottom',
    sm: 'center',
    md: 'center',
    lg: 'center',
    xl: 'center',
    '2xl': 'center',
  },
  mobile: {
    fullscreenOnMobile: true,
    swipeToClose: true,
    minTouchTarget: 44,
    respectSafeArea: true,
  },
  tablet: {
    keepModalBehavior: true,
    adaptToOrientation: true,
  },
};

/**
 * Default accessibility configuration for WCAG 2.1 AA compliance
 */
export const DEFAULT_A11Y_CONFIG: Required<DialogA11yProps> = {
  'aria-label': 'Dialog',
  'aria-modal': true,
  'aria-live': 'polite',
  'aria-atomic': false,
  role: 'dialog',
  focusTrap: {
    enabled: true,
    restoreFocus: true,
    autoFocus: true,
  },
  keyboardNavigation: {
    escapeToClose: true,
    enterToConfirm: false,
    tabCycling: true,
    arrowNavigation: false,
  },
  announcements: {
    onOpen: 'Dialog opened',
    onClose: 'Dialog closed',
  },
};