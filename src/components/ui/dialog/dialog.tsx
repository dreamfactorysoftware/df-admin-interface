"use client";

/**
 * @fileoverview Comprehensive Dialog component system for DreamFactory Admin Interface
 * 
 * Migrated from Angular Material dialog components to React 19/Next.js 15.1 implementation.
 * Replaces all Angular Material dialog patterns (MatDialog, MatDialogRef, MatDialogConfig)
 * with modern React patterns using Headless UI and Tailwind CSS 4.1+.
 * 
 * Key Features:
 * - WCAG 2.1 AA accessibility compliance with focus management and keyboard navigation
 * - Compound component architecture for maximum flexibility (Dialog.Content, Dialog.Header, etc.)
 * - Mobile-first responsive design with breakpoint-aware behavior
 * - Smooth animations using Tailwind CSS transitions and transforms
 * - Multiple dialog variants (modal, sheet, overlay, drawer) with size configurations
 * - Backdrop click handling and escape key management
 * - Support for both controlled and uncontrolled state patterns
 * 
 * @author DreamFactory Admin Interface
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+
 * @see Technical Specification Section 7.1.1 for React 19 integration requirements
 * @see Technical Specification Section 7.7.1 for WCAG 2.1 AA compliance details
 * @see Technical Specification Section 7.7.3 for responsive design implementation
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  forwardRef, 
  useMemo,
  useCallback,
  useState
} from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button/button';
import type {
  DialogProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogContextType,
  DialogRef,
  DialogContentRef,
  DialogHeaderRef,
  DialogFooterRef,
  DialogTitleRef,
  DialogDescriptionRef,
  DialogVariant,
  DialogSizeType,
  DialogPositionType,
  DialogAnimationConfig,
  DialogResponsiveConfig,
  DialogA11yProps,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_RESPONSIVE_CONFIG,
  DEFAULT_A11Y_CONFIG
} from './types';

// =============================================================================
// CONTEXT AND HOOK IMPLEMENTATION
// =============================================================================

/**
 * Dialog context for state management across compound components
 * Enables communication between dialog parts without prop drilling
 */
const DialogContext = createContext<DialogContextType | null>(null);

/**
 * Hook to access dialog context with proper error handling
 * Ensures components are used within dialog provider
 */
const useDialogContext = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog compound components must be used within a Dialog component');
  }
  return context;
};

/**
 * Hook for responsive design detection using window size
 * Implements mobile-first breakpoint detection per Section 7.7.3
 */
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      if (width < 475) setBreakpoint('xs');
      else if (width < 640) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1024) setBreakpoint('lg');
      else if (width < 1280) setBreakpoint('xl');
      else setBreakpoint('2xl');
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Listen for window resize
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    currentBreakpoint: breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
    windowSize
  };
};

// =============================================================================
// DIALOG VARIANT STYLING SYSTEM
// =============================================================================

/**
 * Get dialog container styles based on variant, size, and position
 * Implements Tailwind CSS 4.1+ design tokens with WCAG compliance
 */
const getDialogStyles = (
  variant: DialogVariant,
  size: DialogSizeType,
  position: DialogPositionType,
  responsive: DialogResponsiveConfig,
  currentBreakpoint: string,
  isMobile: boolean
) => {
  // Base styles for all dialog variants
  const baseStyles = [
    'relative', // Position context for content
    'bg-white dark:bg-gray-900', // WCAG compliant background
    'text-gray-900 dark:text-gray-100', // WCAG compliant text contrast
    'focus:outline-none', // Remove default focus (handled by Headless UI)
    'transform transition-all duration-300 ease-out', // Smooth animations
  ];

  // Variant-specific styles
  const variantStyles: Record<DialogVariant, string[]> = {
    modal: [
      'rounded-lg', // Rounded corners for modal
      'shadow-2xl', // Elevated shadow
      'border border-gray-200 dark:border-gray-700', // Subtle border
      'max-h-[90vh]', // Prevent viewport overflow
      'overflow-hidden', // Clean content boundaries
    ],
    sheet: [
      'rounded-t-lg sm:rounded-lg', // Mobile bottom sheet, desktop modal
      'shadow-xl',
      'border border-gray-200 dark:border-gray-700',
      'max-h-[95vh] sm:max-h-[90vh]',
      'overflow-hidden',
    ],
    overlay: [
      'rounded-md',
      'shadow-lg',
      'border border-gray-300 dark:border-gray-600',
      'backdrop-blur-sm',
      'bg-white/95 dark:bg-gray-900/95',
    ],
    drawer: [
      'h-full',
      'shadow-2xl',
      'border-r border-gray-200 dark:border-gray-700',
      'overflow-hidden',
    ],
  };

  // Size configurations with responsive behavior
  const sizeStyles: Record<DialogSizeType, string[]> = {
    xs: ['max-w-xs', 'w-full'],
    sm: ['max-w-sm', 'w-full'],
    md: ['max-w-md', 'w-full'],
    lg: ['max-w-lg', 'w-full'],
    xl: ['max-w-xl', 'w-full'],
    '2xl': ['max-w-2xl', 'w-full'],
    full: ['w-full', 'h-full', 'max-w-none'],
  };

  // Position-specific styles
  const positionStyles: Record<DialogPositionType, string[]> = {
    center: ['mx-auto', 'my-auto'],
    top: ['mx-auto', 'mt-4', 'mb-auto'],
    bottom: ['mx-auto', 'mt-auto', 'mb-4'],
    left: ['mr-auto', 'my-auto', 'ml-4'],
    right: ['ml-auto', 'my-auto', 'mr-4'],
    'top-left': ['mr-auto', 'mb-auto', 'mt-4', 'ml-4'],
    'top-right': ['ml-auto', 'mb-auto', 'mt-4', 'mr-4'],
    'bottom-left': ['mr-auto', 'mt-auto', 'mb-4', 'ml-4'],
    'bottom-right': ['ml-auto', 'mt-auto', 'mb-4', 'mr-4'],
  };

  // Mobile adaptations per Section 7.7.3
  const mobileStyles = isMobile ? [
    responsive.mobile.fullscreenOnMobile && variant !== 'drawer' 
      ? ['fixed', 'inset-4', 'w-auto', 'h-auto', 'max-w-none', 'max-h-none']
      : [],
    responsive.mobile.respectSafeArea 
      ? ['safe-area-inset']
      : [],
  ].flat() : [];

  return cn(
    baseStyles,
    variantStyles[variant],
    !isMobile || !responsive.mobile.fullscreenOnMobile ? sizeStyles[size] : [],
    !isMobile || !responsive.mobile.fullscreenOnMobile ? positionStyles[position] : [],
    mobileStyles
  );
};

/**
 * Get backdrop styles with animation support
 * Implements smooth fade animations per Section 7.1.1
 */
const getBackdropStyles = (variant: DialogVariant) => {
  const baseStyles = [
    'fixed inset-0', // Full viewport coverage
    'bg-black/50 dark:bg-black/70', // Semi-transparent backdrop
    'backdrop-blur-sm', // Subtle blur effect
    'z-40', // Below dialog but above page content
  ];

  // Variant-specific backdrop modifications
  const variantStyles: Record<DialogVariant, string[]> = {
    modal: ['bg-black/50'],
    sheet: ['bg-black/40'],
    overlay: ['bg-black/30'],
    drawer: ['bg-black/60'],
  };

  return cn(baseStyles, variantStyles[variant]);
};

// =============================================================================
// MAIN DIALOG COMPONENT
// =============================================================================

/**
 * Main Dialog component implementing WCAG 2.1 AA standards
 * 
 * Replaces Angular Material dialog infrastructure with accessible Headless UI foundation.
 * Provides compound component architecture for maximum flexibility and maintains
 * complete compatibility with existing DreamFactory dialog patterns.
 * 
 * Key accessibility features:
 * - Focus trapping with restore on close
 * - Keyboard navigation (Escape to close, Tab cycling)
 * - Screen reader announcements and proper ARIA labeling  
 * - Minimum 44x44px touch targets for mobile users
 * - High contrast focus indicators meeting 3:1 ratio requirement
 * 
 * @example
 * ```tsx
 * // Basic modal dialog
 * <Dialog open={isOpen} onOpenChange={setIsOpen}>
 *   <Dialog.Content>
 *     <Dialog.Header>
 *       <Dialog.Title>Confirm Action</Dialog.Title>
 *       <Dialog.Description>This action cannot be undone.</Dialog.Description>
 *     </Dialog.Header>
 *     <Dialog.Footer>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="destructive" onClick={handleConfirm}>Delete</Button>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * 
 * // Responsive mobile sheet
 * <Dialog 
 *   open={isOpen} 
 *   onOpenChange={setIsOpen}
 *   variant="sheet"
 *   size="lg"
 *   responsive={{
 *     mobile: { fullscreenOnMobile: true, swipeToClose: true }
 *   }}
 * >
 *   <Dialog.Content>
 *     <Dialog.Header>
 *       <Dialog.Title>Database Connection Settings</Dialog.Title>
 *     </Dialog.Header>
 *     {/* Form content */}
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export const Dialog = forwardRef<DialogRef, DialogProps>(
  ({
    variant = 'modal',
    size = 'md',
    position = 'center',
    open,
    onOpenChange,
    children,
    className,
    animation = {},
    responsive = {},
    closeOnOutsideClick = true,
    closeOnEscape = true,
    zIndex = 50,
    container,
    preventBodyScroll = true,
    loading = false,
    error = { show: false },
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-modal': ariaModal = true,
    'aria-live': ariaLive = 'polite',
    'aria-atomic': ariaAtomic = false,
    role = 'dialog',
    focusTrap = {},
    keyboardNavigation = {},
    announcements = {},
    ...props
  }, ref) => {
    
    // Merge configurations with defaults
    const finalAnimation: DialogAnimationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...animation };
    const finalResponsive: DialogResponsiveConfig = { ...DEFAULT_RESPONSIVE_CONFIG, ...responsive };
    const finalA11y: Required<DialogA11yProps> = {
      ...DEFAULT_A11Y_CONFIG,
      'aria-label': ariaLabel || DEFAULT_A11Y_CONFIG['aria-label'],
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      'aria-modal': ariaModal,
      'aria-live': ariaLive,
      'aria-atomic': ariaAtomic,
      role,
      focusTrap: { ...DEFAULT_A11Y_CONFIG.focusTrap, ...focusTrap },
      keyboardNavigation: { ...DEFAULT_A11Y_CONFIG.keyboardNavigation, ...keyboardNavigation },
      announcements: { ...DEFAULT_A11Y_CONFIG.announcements, ...announcements },
    };

    // Responsive design hooks
    const { currentBreakpoint, isMobile, isTablet, windowSize } = useBreakpoint();

    // Element refs for focus management
    const dialogRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Responsive size and position based on current breakpoint
    const responsiveSize = useMemo(() => {
      return finalResponsive.sizes[currentBreakpoint] || size;
    }, [finalResponsive.sizes, currentBreakpoint, size]);

    const responsivePosition = useMemo(() => {
      return finalResponsive.positions[currentBreakpoint] || position;
    }, [finalResponsive.positions, currentBreakpoint, position]);

    // Dialog styles computation
    const dialogStyles = useMemo(() => {
      return getDialogStyles(
        variant,
        responsiveSize,
        responsivePosition,
        finalResponsive,
        currentBreakpoint,
        isMobile
      );
    }, [variant, responsiveSize, responsivePosition, finalResponsive, currentBreakpoint, isMobile]);

    const backdropStyles = useMemo(() => {
      return getBackdropStyles(variant);
    }, [variant]);

    // Accessibility announcements
    useEffect(() => {
      if (open && finalA11y.announcements.onOpen) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
        announcement.textContent = finalA11y.announcements.onOpen;
        
        document.body.appendChild(announcement);
        setTimeout(() => {
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
        }, 1000);
      }
    }, [open, finalA11y.announcements.onOpen]);

    // Close dialog handler with accessibility announcements
    const handleClose = useCallback(() => {
      if (finalA11y.announcements.onClose) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only absolute -top-px -left-px w-px h-px overflow-hidden';
        announcement.textContent = finalA11y.announcements.onClose;
        
        document.body.appendChild(announcement);
        setTimeout(() => {
          if (document.body.contains(announcement)) {
            document.body.removeChild(announcement);
          }
        }, 1000);
      }
      
      onOpenChange(false);
    }, [onOpenChange, finalA11y.announcements.onClose]);

    // Context value for compound components
    const contextValue: DialogContextType = useMemo(() => ({
      open,
      onClose: handleClose,
      variant,
      size: responsiveSize,
      position: responsivePosition,
      animation: finalAnimation,
      responsive: finalResponsive,
      a11y: finalA11y,
      currentBreakpoint,
      isMobile,
      isTablet,
      loading,
      error,
      refs: {
        dialog: dialogRef,
        content: contentRef,
        header: headerRef,
        footer: footerRef,
        backdrop: backdropRef,
      },
    }), [
      open,
      handleClose,
      variant,
      responsiveSize,
      responsivePosition,
      finalAnimation,
      finalResponsive,
      finalA11y,
      currentBreakpoint,
      isMobile,
      isTablet,
      loading,
      error,
    ]);

    // Prevent body scroll when dialog is open
    useEffect(() => {
      if (preventBodyScroll && open) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [preventBodyScroll, open]);

    // Swipe to close gesture for mobile
    useEffect(() => {
      if (!isMobile || !finalResponsive.mobile.swipeToClose || !open) return;

      let startY = 0;
      let currentY = 0;
      let isDragging = false;

      const handleTouchStart = (e: TouchEvent) => {
        startY = e.touches[0].clientY;
        isDragging = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow downward swipes for bottom sheets
        if (variant === 'sheet' && deltaY > 0) {
          e.preventDefault();
          // Add visual feedback for swipe gesture
          if (contentRef.current) {
            contentRef.current.style.transform = `translateY(${Math.min(deltaY, 100)}px)`;
          }
        }
      };

      const handleTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaY = currentY - startY;
        
        // Close if swiped down more than 100px
        if (variant === 'sheet' && deltaY > 100) {
          handleClose();
        } else if (contentRef.current) {
          // Reset position
          contentRef.current.style.transform = '';
        }
      };

      const element = contentRef.current;
      if (element) {
        element.addEventListener('touchstart', handleTouchStart);
        element.addEventListener('touchmove', handleTouchMove);
        element.addEventListener('touchend', handleTouchEnd);

        return () => {
          element.removeEventListener('touchstart', handleTouchStart);
          element.removeEventListener('touchmove', handleTouchMove);
          element.removeEventListener('touchend', handleTouchEnd);
        };
      }
    }, [isMobile, finalResponsive.mobile.swipeToClose, open, variant, handleClose]);

    return (
      <DialogContext.Provider value={contextValue}>
        <Transition appear show={open} as={React.Fragment}>
          <HeadlessDialog
            ref={ref}
            as="div"
            className="relative"
            style={{ zIndex }}
            onClose={closeOnOutsideClick ? handleClose : () => {}}
            static={!closeOnOutsideClick}
            {...props}
          >
            {/* Backdrop with animation */}
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                ref={backdropRef}
                className={backdropStyles}
                aria-hidden="true"
              />
            </Transition.Child>

            {/* Dialog container */}
            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={React.Fragment}
                  enter="ease-out duration-300"
                  enterFrom={
                    variant === 'sheet' && isMobile
                      ? "opacity-0 translate-y-full"
                      : variant === 'drawer'
                      ? "opacity-0 -translate-x-full"
                      : "opacity-0 scale-95"
                  }
                  enterTo="opacity-100 translate-y-0 translate-x-0 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo={
                    variant === 'sheet' && isMobile
                      ? "opacity-0 translate-y-full"
                      : variant === 'drawer'
                      ? "opacity-0 -translate-x-full"
                      : "opacity-0 scale-95"
                  }
                >
                  <HeadlessDialog.Panel
                    ref={dialogRef}
                    className={cn(dialogStyles, className)}
                    aria-label={finalA11y['aria-label']}
                    aria-labelledby={finalA11y['aria-labelledby']}
                    aria-describedby={finalA11y['aria-describedby']}
                    aria-modal={finalA11y['aria-modal']}
                    aria-live={finalA11y['aria-live']}
                    aria-atomic={finalA11y['aria-atomic']}
                    role={finalA11y.role}
                  >
                    {/* Loading overlay */}
                    {loading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-10">
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Loading...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Error banner */}
                    {error.show && (
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-red-700 dark:text-red-200">
                                {error.message || 'An error occurred'}
                              </p>
                            </div>
                          </div>
                          {error.retry && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={error.retry}
                              className="ml-4"
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dialog content */}
                    {children}
                  </HeadlessDialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </HeadlessDialog>
        </Transition>
      </DialogContext.Provider>
    );
  }
);

Dialog.displayName = 'Dialog';

// =============================================================================
// COMPOUND COMPONENTS
// =============================================================================

/**
 * Dialog content container component
 * 
 * Provides the main content area with proper styling, scrolling behavior,
 * and accessibility features. Implements proper content boundaries and
 * ensures content is readable and navigable.
 */
const DialogContent = forwardRef<DialogContentRef, DialogContentProps>(
  ({ children, className, scrollable = true, maxHeight, padding = 'md', ...props }, ref) => {
    const { refs } = useDialogContext();

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    return (
      <div
        ref={ref || refs.content}
        className={cn(
          'flex flex-col w-full h-full',
          scrollable && 'overflow-hidden',
          paddingStyles[padding],
          className
        )}
        style={maxHeight ? { maxHeight } : undefined}
        {...props}
      >
        <div className={cn(
          'flex flex-col',
          scrollable && 'overflow-y-auto overflow-x-hidden',
          scrollable && 'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600'
        )}>
          {children}
        </div>
      </div>
    );
  }
);

DialogContent.displayName = 'Dialog.Content';

/**
 * Dialog header component
 * 
 * Provides the title area with optional close button and proper accessibility.
 * Implements sticky header behavior and responsive layout adjustments.
 */
const DialogHeader = forwardRef<DialogHeaderRef, DialogHeaderProps>(
  ({
    children,
    className,
    showCloseButton = true,
    closeButtonLabel = 'Close dialog',
    align = 'left',
    sticky = false,
    ...props
  }, ref) => {
    const { onClose, refs, isMobile } = useDialogContext();

    const alignmentStyles = {
      left: 'justify-start text-left',
      center: 'justify-center text-center',
      right: 'justify-end text-right',
    };

    return (
      <div
        ref={ref || refs.header}
        className={cn(
          'flex items-start justify-between',
          sticky && 'sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
          !sticky && 'mb-4',
          isMobile ? 'px-4 py-3' : 'px-6 py-4',
          className
        )}
        {...props}
      >
        <div className={cn('flex-1 min-w-0', alignmentStyles[align])}>
          {children}
        </div>
        
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label={closeButtonLabel}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

DialogHeader.displayName = 'Dialog.Header';

/**
 * Dialog footer component
 * 
 * Provides the action button area with proper spacing, alignment, and
 * responsive behavior. Supports button reordering on mobile devices.
 */
const DialogFooter = forwardRef<DialogFooterRef, DialogFooterProps>(
  ({
    children,
    className,
    align = 'right',
    sticky = false,
    reverseOnMobile = true,
    ...props
  }, ref) => {
    const { refs, isMobile } = useDialogContext();

    const alignmentStyles = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    };

    return (
      <div
        ref={ref || refs.footer}
        className={cn(
          'flex items-center gap-3',
          sticky && 'sticky bottom-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700',
          !sticky && 'mt-6',
          alignmentStyles[align],
          reverseOnMobile && isMobile && 'flex-col-reverse gap-2',
          isMobile ? 'px-4 py-3' : 'px-6 py-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogFooter.displayName = 'Dialog.Footer';

/**
 * Dialog title component
 * 
 * Semantic title component with proper heading levels and accessibility.
 * Automatically registers with dialog context for proper labeling.
 */
const DialogTitle = forwardRef<DialogTitleRef, DialogTitleProps>(
  ({ children, className, level = 2, visualLevel, as, ...props }, ref) => {
    const Component = as || (`h${level}` as const);
    const titleId = `dialog-title-${Math.random().toString(36).substr(2, 9)}`;

    const sizeStyles = {
      1: 'text-3xl font-bold',
      2: 'text-xl font-semibold',
      3: 'text-lg font-semibold',
      4: 'text-base font-semibold',
      5: 'text-sm font-semibold',
      6: 'text-xs font-semibold',
    };

    const displayLevel = visualLevel || level;

    return (
      <HeadlessDialog.Title
        ref={ref}
        as={Component}
        id={titleId}
        className={cn(
          'text-gray-900 dark:text-gray-100',
          'leading-tight',
          sizeStyles[displayLevel],
          className
        )}
        {...props}
      >
        {children}
      </HeadlessDialog.Title>
    );
  }
);

DialogTitle.displayName = 'Dialog.Title';

/**
 * Dialog description component
 * 
 * Accessible description text for screen readers and visual users.
 * Automatically registers with dialog context for proper labeling.
 */
const DialogDescription = forwardRef<DialogDescriptionRef, DialogDescriptionProps>(
  ({ children, className, size = 'md', ...props }, ref) => {
    const descriptionId = `dialog-description-${Math.random().toString(36).substr(2, 9)}`;

    const sizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    return (
      <HeadlessDialog.Description
        ref={ref}
        id={descriptionId}
        className={cn(
          'text-gray-600 dark:text-gray-400',
          'leading-relaxed',
          'mt-2',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </HeadlessDialog.Description>
    );
  }
);

DialogDescription.displayName = 'Dialog.Description';

/**
 * Dialog close button component
 * 
 * Accessible close button with proper labeling and keyboard navigation.
 * Can be placed anywhere within the dialog content.
 */
const DialogClose = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, className, ...props }, ref) => {
    const { onClose } = useDialogContext();

    return (
      <Button
        ref={ref}
        variant="outline"
        onClick={onClose}
        className={cn('min-w-[80px]', className)}
        {...props}
      >
        {children || 'Close'}
      </Button>
    );
  }
);

DialogClose.displayName = 'Dialog.Close';

// Attach compound components to main Dialog component
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Close = DialogClose;

// Export the main component with compound components attached
export default Dialog;

// Named exports for flexibility
export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  useDialogContext,
};

// Type exports
export type {
  DialogProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogRef,
  DialogContentRef,
  DialogHeaderRef,
  DialogFooterRef,
  DialogTitleRef,
  DialogDescriptionRef,
};