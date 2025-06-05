import React from 'react';

/**
 * Dialog variant types supporting different modal patterns
 * Migrated from Angular Material dialog types to React patterns
 */
export type DialogVariant = 'modal' | 'sheet' | 'overlay' | 'drawer';

/**
 * Dialog size configuration for responsive design
 * Supporting mobile-first approach per Section 7.7.3
 */
export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * Dialog position options for different display modes
 */
export type DialogPosition = 'center' | 'top' | 'bottom' | 'left' | 'right';

/**
 * Animation configuration for smooth transitions using Tailwind CSS
 * Per Section 7.1.1 requirements for enhanced user experience
 */
export interface DialogAnimationConfig {
  /** Animation duration in milliseconds */
  duration?: number;
  /** Animation timing function */
  timing?: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  /** Enable/disable enter animations */
  enterAnimation?: boolean;
  /** Enable/disable exit animations */
  exitAnimation?: boolean;
  /** Custom enter classes for Tailwind CSS */
  enterClasses?: string;
  /** Custom exit classes for Tailwind CSS */
  exitClasses?: string;
}

/**
 * Accessibility configuration for WCAG 2.1 AA compliance
 * Per Section 7.7.1 accessibility requirements
 */
export interface DialogA11yProps {
  /** ARIA label for the dialog */
  'aria-label'?: string;
  /** ARIA described by reference */
  'aria-describedby'?: string;
  /** ARIA labelledby reference */
  'aria-labelledby'?: string;
  /** Role override for specialized dialogs */
  role?: 'dialog' | 'alertdialog';
  /** Hide dialog from screen readers when closed */
  'aria-hidden'?: boolean;
  /** Live region configuration for announcements */
  'aria-live'?: 'off' | 'polite' | 'assertive';
  /** Focus restoration target after dialog closes */
  restoreFocus?: boolean;
  /** Initial focus target within dialog */
  initialFocus?: React.RefObject<HTMLElement>;
  /** Final focus target when dialog closes */
  finalFocus?: React.RefObject<HTMLElement>;
}

/**
 * Base props for the main Dialog component
 * Replacing Angular Material dialog configuration with React patterns
 */
export interface DialogProps extends DialogA11yProps {
  /** Controls dialog visibility - supports controlled pattern */
  open?: boolean;
  /** Callback when dialog should close - supports controlled pattern */
  onClose?: (reason?: 'backdrop' | 'escape' | 'close-button' | 'api') => void;
  /** Dialog variant determining display mode */
  variant?: DialogVariant;
  /** Size configuration for responsive behavior */
  size?: DialogSize;
  /** Position configuration for layout */
  position?: DialogPosition;
  /** Animation configuration */
  animation?: DialogAnimationConfig;
  /** Prevent closing on backdrop click */
  disableBackdropClose?: boolean;
  /** Prevent closing on escape key press */
  disableEscapeKeyDown?: boolean;
  /** Show close button in header */
  showCloseButton?: boolean;
  /** Custom backdrop styling */
  backdropClassName?: string;
  /** Custom dialog container styling */
  className?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Z-index for layering */
  zIndex?: number;
  /** Custom data attributes for testing */
  'data-testid'?: string;
}

/**
 * Props for Dialog.Content compound component
 */
export interface DialogContentProps {
  /** Content styling */
  className?: string;
  /** Content elements */
  children: React.ReactNode;
  /** Disable default padding */
  noPadding?: boolean;
  /** Content area scroll behavior */
  scrollBehavior?: 'auto' | 'inside' | 'outside';
  /** Maximum height for content area */
  maxHeight?: string;
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Props for Dialog.Header compound component
 */
export interface DialogHeaderProps {
  /** Header styling */
  className?: string;
  /** Header content */
  children: React.ReactNode;
  /** Show separator line */
  showSeparator?: boolean;
  /** Enable close button in header */
  showCloseButton?: boolean;
  /** Close button callback */
  onClose?: () => void;
  /** Custom close button icon */
  closeIcon?: React.ReactNode;
  /** Header padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Props for Dialog.Footer compound component
 */
export interface DialogFooterProps {
  /** Footer styling */
  className?: string;
  /** Footer content */
  children: React.ReactNode;
  /** Show separator line */
  showSeparator?: boolean;
  /** Content alignment */
  align?: 'left' | 'center' | 'right' | 'space-between';
  /** Footer padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Sticky footer behavior */
  sticky?: boolean;
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Props for Dialog.Title compound component
 */
export interface DialogTitleProps {
  /** Title text */
  children: React.ReactNode;
  /** Custom styling */
  className?: string;
  /** Typography size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Title element tag */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Props for Dialog.Description compound component
 */
export interface DialogDescriptionProps {
  /** Description text */
  children: React.ReactNode;
  /** Custom styling */
  className?: string;
  /** Typography size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Props for Dialog.Close compound component
 */
export interface DialogCloseProps {
  /** Custom styling */
  className?: string;
  /** Close callback */
  onClose?: () => void;
  /** Button content */
  children?: React.ReactNode;
  /** Custom close icon */
  icon?: React.ReactNode;
  /** Button variant */
  variant?: 'icon' | 'text' | 'outlined';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Accessibility label */
  'aria-label'?: string;
  /** Custom data attributes */
  'data-testid'?: string;
}

/**
 * Context type for dialog state management across compound components
 * Enables communication between Dialog and its child components
 */
export interface DialogContextType {
  /** Current open state */
  open: boolean;
  /** Close dialog function */
  close: (reason?: 'backdrop' | 'escape' | 'close-button' | 'api') => void;
  /** Dialog variant */
  variant: DialogVariant;
  /** Dialog size */
  size: DialogSize;
  /** Dialog position */
  position: DialogPosition;
  /** Animation configuration */
  animation: DialogAnimationConfig;
  /** Title element ID for aria-labelledby */
  titleId?: string;
  /** Description element ID for aria-describedby */
  descriptionId?: string;
  /** Close button configuration */
  showCloseButton: boolean;
  /** Backdrop close configuration */
  disableBackdropClose: boolean;
  /** Escape key configuration */
  disableEscapeKeyDown: boolean;
}

/**
 * Promise-based dialog API for programmatic usage
 * Replacing Angular's synchronous dialog pattern with async React patterns
 */
export interface DialogPromiseAPI<T = any> {
  /** Promise that resolves when dialog completes */
  result: Promise<T>;
  /** Programmatically close the dialog */
  close: (result?: T) => void;
  /** Programmatically dismiss the dialog */
  dismiss: (reason?: string) => void;
  /** Current dialog instance reference */
  ref: React.RefObject<HTMLDivElement>;
}

/**
 * Configuration for programmatic dialog creation
 */
export interface DialogConfig<T = any> extends Omit<DialogProps, 'open' | 'children'> {
  /** Dialog content component or render function */
  content: React.ComponentType<{ data?: T; close: (result?: T) => void }> | React.ReactNode;
  /** Data to pass to dialog content */
  data?: T;
  /** Container element for portal rendering */
  container?: Element;
  /** Cleanup callback when dialog unmounts */
  onUnmount?: () => void;
}

/**
 * Mobile-responsive configuration for different screen sizes
 * Supporting mobile-first approach per Section 7.7.3
 */
export interface DialogResponsiveConfig {
  /** Mobile configuration (< 768px) */
  mobile?: Partial<Pick<DialogProps, 'variant' | 'size' | 'position'>>;
  /** Tablet configuration (768px - 1024px) */
  tablet?: Partial<Pick<DialogProps, 'variant' | 'size' | 'position'>>;
  /** Desktop configuration (> 1024px) */
  desktop?: Partial<Pick<DialogProps, 'variant' | 'size' | 'position'>>;
  /** Breakpoint configuration */
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Dialog hook return type for custom dialog management
 */
export interface UseDialogReturn {
  /** Current open state */
  open: boolean;
  /** Open dialog function */
  openDialog: () => void;
  /** Close dialog function */
  closeDialog: (reason?: 'backdrop' | 'escape' | 'close-button' | 'api') => void;
  /** Toggle dialog state */
  toggleDialog: () => void;
  /** Dialog props for spreading to Dialog component */
  dialogProps: Pick<DialogProps, 'open' | 'onClose'>;
}

/**
 * Keyboard navigation configuration
 * For WCAG 2.1 AA compliance per Section 7.7.1
 */
export interface DialogKeyboardConfig {
  /** Enable escape key to close */
  enableEscape?: boolean;
  /** Enable tab cycling within dialog */
  enableTabCycling?: boolean;
  /** Enable enter key to confirm default action */
  enableEnterToConfirm?: boolean;
  /** Custom keyboard shortcuts */
  customShortcuts?: Array<{
    key: string;
    modifiers?: Array<'ctrl' | 'alt' | 'shift' | 'meta'>;
    action: () => void;
    description?: string;
  }>;
}

/**
 * Error boundary configuration for robust dialog behavior
 */
export interface DialogErrorBoundaryProps {
  /** Custom error component */
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  /** Error callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Enable development mode error overlay */
  development?: boolean;
}