'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useId, 
  useRef, 
  useState, 
  forwardRef,
  Fragment
} from 'react';
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  DialogProps,
  DialogContentProps,
  DialogHeaderProps,
  DialogFooterProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
  DialogContextType,
  DialogVariant,
  DialogSize,
  DialogPosition,
  DialogAnimationConfig
} from './types';

/**
 * Dialog Context for compound component communication
 * Enables state sharing across Dialog.* subcomponents
 */
const DialogContext = createContext<DialogContextType | null>(null);

/**
 * Hook to access dialog context within compound components
 * Throws error if used outside Dialog component tree
 */
const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog compound components must be used within a Dialog component');
  }
  return context;
};

/**
 * Custom hook for responsive dialog behavior
 * Implements mobile-first approach per Section 7.7.3
 */
const useResponsiveDialog = (variant: DialogVariant, size: DialogSize) => {
  const [responsiveConfig, setResponsiveConfig] = useState({ variant, size });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Mobile-first responsive breakpoints
      if (width < 768) {
        // Mobile: prefer drawer/sheet variants for better UX
        if (variant === 'modal' && size === 'xl') {
          setResponsiveConfig({ variant: 'sheet', size: 'full' });
        } else if (variant === 'modal' && (size === 'lg' || size === 'xl')) {
          setResponsiveConfig({ variant: 'sheet', size: 'lg' });
        } else {
          setResponsiveConfig({ variant, size: size === 'xl' ? 'lg' : size });
        }
      } else if (width < 1024) {
        // Tablet: balanced approach
        setResponsiveConfig({ 
          variant: variant === 'drawer' ? 'sheet' : variant, 
          size: size === 'full' ? 'xl' : size 
        });
      } else {
        // Desktop: use original configuration
        setResponsiveConfig({ variant, size });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [variant, size]);

  return responsiveConfig;
};

/**
 * Get variant-specific styling classes
 * Implements design tokens from Section 7.7.1
 */
const getVariantStyles = (variant: DialogVariant, size: DialogSize, position: DialogPosition) => {
  const baseTransform = {
    modal: 'translate-x-0 translate-y-0',
    sheet: variant === 'sheet' && position === 'bottom' 
      ? 'translate-y-0' 
      : position === 'right' 
        ? 'translate-x-0' 
        : 'translate-x-0',
    overlay: 'translate-x-0 translate-y-0',
    drawer: position === 'left' 
      ? 'translate-x-0' 
      : position === 'right' 
        ? 'translate-x-0' 
        : 'translate-x-0'
  };

  const variantClasses = {
    modal: cn(
      'relative mx-auto my-8 w-full max-w-none rounded-lg',
      'bg-white dark:bg-gray-900',
      'shadow-xl ring-1 ring-black ring-opacity-5',
      'focus:outline-none',
      baseTransform.modal
    ),
    sheet: cn(
      'fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto min-h-[50vh] flex-col rounded-t-[10px]',
      'bg-white dark:bg-gray-900',
      'shadow-xl ring-1 ring-black ring-opacity-5',
      'focus:outline-none',
      position === 'right' && 'inset-y-0 right-0 h-full w-full max-w-sm rounded-l-[10px] rounded-t-none',
      position === 'left' && 'inset-y-0 left-0 h-full w-full max-w-sm rounded-r-[10px] rounded-t-none',
      baseTransform.sheet
    ),
    overlay: cn(
      'relative mx-auto mt-20 w-full max-w-none rounded-lg',
      'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
      'border border-gray-200 dark:border-gray-700',
      'shadow-2xl',
      'focus:outline-none',
      baseTransform.overlay
    ),
    drawer: cn(
      'fixed inset-y-0 flex w-full max-w-xs flex-col',
      'bg-white dark:bg-gray-900',
      'shadow-xl ring-1 ring-black ring-opacity-5',
      'focus:outline-none',
      position === 'left' ? 'left-0' : 'right-0',
      baseTransform.drawer
    )
  };

  const sizeClasses = {
    modal: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-7xl mx-4'
    },
    sheet: {
      sm: 'max-w-sm',
      md: 'max-w-md', 
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-none'
    },
    overlay: {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg', 
      xl: 'max-w-xl',
      full: 'max-w-4xl mx-4'
    },
    drawer: {
      sm: 'max-w-xs',
      md: 'max-w-sm',
      lg: 'max-w-md',
      xl: 'max-w-lg',
      full: 'max-w-xl'
    }
  };

  return cn(variantClasses[variant], sizeClasses[variant][size]);
};

/**
 * Get animation configuration based on variant
 * Implements smooth transitions per Section 7.1.1
 */
const getAnimationConfig = (variant: DialogVariant, position: DialogPosition): DialogAnimationConfig => {
  const configs = {
    modal: {
      duration: 300,
      timing: 'ease-out' as const,
      enterAnimation: true,
      exitAnimation: true,
      enterClasses: 'opacity-0 scale-95 translate-y-4',
      exitClasses: 'opacity-100 scale-100 translate-y-0'
    },
    sheet: {
      duration: 350,
      timing: 'ease-out' as const,
      enterAnimation: true,
      exitAnimation: true,
      enterClasses: position === 'bottom' 
        ? 'opacity-0 translate-y-full' 
        : position === 'right'
          ? 'opacity-0 translate-x-full'
          : 'opacity-0 -translate-x-full',
      exitClasses: 'opacity-100 translate-x-0 translate-y-0'
    },
    overlay: {
      duration: 250,
      timing: 'ease-in-out' as const,
      enterAnimation: true,
      exitAnimation: true,
      enterClasses: 'opacity-0 scale-110',
      exitClasses: 'opacity-100 scale-100'
    },
    drawer: {
      duration: 300,
      timing: 'ease-out' as const,
      enterAnimation: true,
      exitAnimation: true,
      enterClasses: position === 'left' ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full',
      exitClasses: 'opacity-100 translate-x-0'
    }
  };

  return configs[variant];
};

/**
 * Main Dialog Component
 * Implements WCAG 2.1 AA accessible modal patterns using Headless UI
 * Supports compound component architecture for flexible composition
 */
const Dialog = forwardRef<HTMLDivElement, DialogProps>(({
  open = false,
  onClose,
  variant = 'modal',
  size = 'md',
  position = 'center',
  animation,
  disableBackdropClose = false,
  disableEscapeKeyDown = false,
  showCloseButton = true,
  backdropClassName,
  className,
  children,
  zIndex = 50,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  role = 'dialog',
  restoreFocus = true,
  initialFocus,
  finalFocus,
  'data-testid': dataTestId,
  ...restProps
}, ref) => {
  // Generate unique IDs for accessibility
  const titleId = useId();
  const descriptionId = useId();
  
  // Responsive dialog configuration
  const { variant: responsiveVariant, size: responsiveSize } = useResponsiveDialog(variant, size);
  
  // Animation configuration
  const animationConfig = animation || getAnimationConfig(responsiveVariant, position);
  
  // Internal state for controlled/uncontrolled patterns
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  // Focus management refs
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle dialog close with reason tracking
  const handleClose = (reason: 'backdrop' | 'escape' | 'close-button' | 'api' = 'api') => {
    if (reason === 'backdrop' && disableBackdropClose) return;
    if (reason === 'escape' && disableEscapeKeyDown) return;
    
    if (isControlled) {
      onClose?.(reason);
    } else {
      setInternalOpen(false);
      onClose?.(reason);
    }
  };

  // Focus management effects
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Set initial focus
      if (initialFocus?.current) {
        setTimeout(() => initialFocus.current?.focus(), 100);
      } else if (dialogRef.current) {
        const firstFocusable = dialogRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        setTimeout(() => firstFocusable?.focus(), 100);
      }
    } else if (restoreFocus && previousActiveElement.current) {
      // Restore focus when dialog closes
      if (finalFocus?.current) {
        finalFocus.current.focus();
      } else {
        previousActiveElement.current.focus();
      }
      previousActiveElement.current = null;
    }
  }, [isOpen, initialFocus, finalFocus, restoreFocus]);

  // Keyboard event handling for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          if (!disableEscapeKeyDown) {
            event.preventDefault();
            handleClose('escape');
          }
          break;
        case 'Tab':
          // Tab cycling within dialog
          if (dialogRef.current) {
            const focusableElements = dialogRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, disableEscapeKeyDown, handleClose]);

  // Context value for compound components
  const contextValue: DialogContextType = {
    open: isOpen,
    close: handleClose,
    variant: responsiveVariant,
    size: responsiveSize,
    position,
    animation: animationConfig,
    titleId,
    descriptionId,
    showCloseButton,
    disableBackdropClose,
    disableEscapeKeyDown
  };

  // Get styling classes
  const dialogClasses = getVariantStyles(responsiveVariant, responsiveSize, position);

  return (
    <DialogContext.Provider value={contextValue}>
      <Transition.Root show={isOpen} as={Fragment}>
        <HeadlessDialog
          as="div"
          className={cn('relative', `z-${zIndex}`)}
          onClose={() => handleClose('backdrop')}
          initialFocus={initialFocus}
          {...restProps}
        >
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className={cn(
                'fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity',
                backdropClassName
              )}
              aria-hidden="true"
            />
          </Transition.Child>

          {/* Dialog Container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className={cn(
              'flex min-h-full items-center justify-center p-4 text-center',
              responsiveVariant === 'sheet' && position === 'bottom' && 'items-end',
              responsiveVariant === 'sheet' && (position === 'left' || position === 'right') && 'items-center justify-start p-0',
              responsiveVariant === 'drawer' && 'items-center justify-start p-0'
            )}>
              <Transition.Child
                as={Fragment}
                enter={`ease-out duration-${animationConfig.duration}`}
                enterFrom={animationConfig.enterClasses}
                enterTo={animationConfig.exitClasses}
                leave={`ease-in duration-${animationConfig.duration}`}
                leaveFrom={animationConfig.exitClasses}
                leaveTo={animationConfig.enterClasses}
              >
                <HeadlessDialog.Panel
                  ref={ref || dialogRef}
                  className={cn(dialogClasses, className)}
                  role={role}
                  aria-label={ariaLabel}
                  aria-labelledby={ariaLabelledBy || titleId}
                  aria-describedby={ariaDescribedBy || descriptionId}
                  data-testid={dataTestId}
                >
                  {children}
                </HeadlessDialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </HeadlessDialog>
      </Transition.Root>
    </DialogContext.Provider>
  );
});

Dialog.displayName = 'Dialog';

/**
 * Dialog.Content - Content area component
 * Provides consistent content styling and scroll behavior
 */
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(({
  className,
  children,
  noPadding = false,
  scrollBehavior = 'inside',
  maxHeight,
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const { variant } = useDialogContext();
  
  return (
    <div
      ref={ref}
      className={cn(
        'flex-1',
        !noPadding && 'px-6 py-4',
        scrollBehavior === 'inside' && 'overflow-y-auto',
        variant === 'sheet' && 'min-h-0',
        className
      )}
      style={{ maxHeight }}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </div>
  );
});

DialogContent.displayName = 'Dialog.Content';

/**
 * Dialog.Header - Header component with optional close button
 * Implements proper heading hierarchy for accessibility
 */
const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(({
  className,
  children,
  showSeparator = true,
  showCloseButton: propShowCloseButton,
  onClose,
  closeIcon,
  padding = 'md',
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const { close, showCloseButton: contextShowCloseButton } = useDialogContext();
  const shouldShowCloseButton = propShowCloseButton ?? contextShowCloseButton;
  
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };

  const handleClose = () => {
    onClose?.();
    close('close-button');
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between',
        paddingClasses[padding],
        showSeparator && 'border-b border-gray-200 dark:border-gray-700',
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      <div className="flex-1 pr-4">
        {children}
      </div>
      
      {shouldShowCloseButton && (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'rounded-md p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
            'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
          aria-label="Close dialog"
        >
          {closeIcon || <X className="h-5 w-5" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
});

DialogHeader.displayName = 'Dialog.Header';

/**
 * Dialog.Footer - Footer component with flexible layout options
 * Supports different alignment and sticky positioning
 */
const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(({
  className,
  children,
  showSeparator = true,
  align = 'right',
  padding = 'md',
  sticky = false,
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };

  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    'space-between': 'justify-between'
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center',
        alignmentClasses[align],
        paddingClasses[padding],
        showSeparator && 'border-t border-gray-200 dark:border-gray-700',
        sticky && 'sticky bottom-0 bg-white dark:bg-gray-900',
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </div>
  );
});

DialogFooter.displayName = 'Dialog.Footer';

/**
 * Dialog.Title - Accessible title component
 * Automatically handles ARIA labeling for dialog
 */
const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(({
  children,
  className,
  size = 'lg',
  as: Component = 'h2',
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const { titleId } = useDialogContext();
  
  const sizeClasses = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-bold'
  };

  return (
    <Component
      ref={ref}
      id={titleId}
      className={cn(
        'text-gray-900 dark:text-gray-100',
        sizeClasses[size],
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </Component>
  );
});

DialogTitle.displayName = 'Dialog.Title';

/**
 * Dialog.Description - Accessible description component
 * Automatically handles ARIA describing for dialog
 */
const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(({
  children,
  className,
  size = 'md',
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const { descriptionId } = useDialogContext();
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn(
        'text-gray-600 dark:text-gray-400',
        sizeClasses[size],
        className
      )}
      data-testid={dataTestId}
      {...props}
    >
      {children}
    </p>
  );
});

DialogDescription.displayName = 'Dialog.Description';

/**
 * Dialog.Close - Close button component
 * Provides consistent close button styling and behavior
 */
const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(({
  className,
  onClose,
  children,
  icon,
  variant = 'text',
  size = 'md',
  'aria-label': ariaLabel = 'Close',
  'data-testid': dataTestId,
  ...props
}, ref) => {
  const { close } = useDialogContext();
  
  const handleClick = () => {
    onClose?.();
    close('close-button');
  };

  const variantClasses = {
    icon: cn(
      'rounded-md p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400',
      'hover:bg-gray-100 dark:hover:bg-gray-800'
    ),
    text: cn(
      'rounded-md px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300',
      'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
    ),
    outlined: cn(
      'rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium',
      'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    )
  };

  const sizeClasses = {
    sm: variant === 'icon' ? 'p-1' : 'px-2 py-1 text-xs',
    md: variant === 'icon' ? 'p-2' : 'px-3 py-2 text-sm',
    lg: variant === 'icon' ? 'p-3' : 'px-4 py-2 text-base'
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      className={cn(
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      {...props}
    >
      {variant === 'icon' && (icon || <X className="h-4 w-4" aria-hidden="true" />)}
      {variant !== 'icon' && (children || 'Close')}
    </button>
  );
});

DialogClose.displayName = 'Dialog.Close';

// Attach compound components to main Dialog component
Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Close = DialogClose;

/**
 * Custom hook for dialog state management
 * Provides controlled and uncontrolled patterns for dialog usage
 */
export const useDialog = (defaultOpen = false) => {
  const [open, setOpen] = useState(defaultOpen);
  
  const openDialog = () => setOpen(true);
  const closeDialog = (reason?: 'backdrop' | 'escape' | 'close-button' | 'api') => setOpen(false);
  const toggleDialog = () => setOpen(prev => !prev);
  
  return {
    open,
    openDialog,
    closeDialog,
    toggleDialog,
    dialogProps: {
      open,
      onClose: closeDialog
    }
  };
};

export default Dialog;
export { Dialog };
export type { DialogProps, DialogContextType };