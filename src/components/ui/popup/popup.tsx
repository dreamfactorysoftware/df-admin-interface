'use client';

import React, { Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { PopupProps, PopupVariant, PopupSize, POPUP_SIZE_CONFIG } from './types';

// Note: These hooks don't exist yet but are expected to be created as part of the migration
// They should implement the interfaces described in the comments below
interface AuthHook {
  logout: (redirectPath?: string[]) => Promise<void>;
  user: any;
}

interface RouterHook {
  push: (path: string) => void;
  pathname: string;
}

// Temporary implementations until actual hooks are created
const useAuth = (): AuthHook => ({
  logout: async (redirectPath?: string[]) => {
    // Implementation should redirect to authentication flow
    console.warn('useAuth hook not implemented yet');
    if (redirectPath && redirectPath.length > 0) {
      window.location.href = redirectPath.join('/');
    }
  },
  user: null,
});

const useRouter = (): RouterHook => ({
  push: (path: string) => {
    // Implementation should use Next.js router
    console.warn('useRouter hook not implemented yet');
    window.location.href = path;
  },
  pathname: typeof window !== 'undefined' ? window.location.pathname : '',
});

// Button component assumption - should match the actual Button component interface
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}) => {
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'min-h-[44px]' // WCAG minimum touch target size
  );

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 border border-primary-600',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 active:bg-secondary-300 border border-secondary-300',
    outline: 'bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100 border-2 border-primary-600',
    ghost: 'bg-transparent text-secondary-700 hover:bg-secondary-100 active:bg-secondary-200 border border-transparent',
  };

  const sizes = {
    sm: 'h-11 px-4 text-sm min-w-[44px]',
    md: 'h-12 px-6 text-base min-w-[48px]',
    lg: 'h-14 px-8 text-lg min-w-[56px]',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Popup Component - React implementation of password security notice functionality
 * 
 * Replaces Angular DfPopupComponent with WCAG 2.1 AA accessibility standards including:
 * - Focus trapping via Headless UI Dialog
 * - Escape key handling
 * - Proper ARIA labeling
 * - Configurable message content and button visibility
 * - Authentication redirect workflow integration
 * 
 * @param props PopupProps configuration
 */
export const Popup: React.FC<PopupProps> = ({
  children,
  isOpen,
  onClose,
  onRemindLater,
  onOpen,
  onButtonClick,
  title = 'Password Security Notice',
  variant = 'authentication',
  size = 'md',
  dismissOnClickOutside = true,
  showCloseButton = true,
  showRemindMeLater = true,
  actions,
  className,
  accessibility = {
    role: 'dialog',
    trapFocus: true,
    initialFocus: 'first',
    announceOnOpen: true,
    modal: true,
  },
  animation = {
    preset: 'fade',
    duration: 200,
    easing: 'ease-out',
    animateBackdrop: true,
  },
  'data-testid': testId,
  ...props
}) => {
  const auth = useAuth();
  const router = useRouter();

  // Default authentication workflow message
  const defaultMessage = "Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.";

  // Effect to announce popup opening to screen readers
  useEffect(() => {
    if (isOpen && accessibility.announceOnOpen) {
      const announcement = accessibility.openAnnouncement || `${title} popup opened`;
      
      // Create a live region for screen reader announcement
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;
      
      document.body.appendChild(liveRegion);
      
      // Clean up after announcement
      setTimeout(() => {
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      }, 1000);
      
      // Call onOpen callback if provided
      onOpen?.();
    }
  }, [isOpen, accessibility.announceOnOpen, accessibility.openAnnouncement, title, onOpen]);

  // Handle button clicks with analytics and callback support
  const handleButtonClick = (buttonType: 'close' | 'confirm' | 'remindLater', action?: () => void) => {
    return () => {
      // Execute button-specific action
      action?.();
      
      // Notify parent component
      onButtonClick?.(buttonType);
      
      // Handle specific authentication workflows
      if (buttonType === 'confirm') {
        handleConfirm();
      } else if (buttonType === 'remindLater') {
        handleRemindLater();
      } else {
        onClose();
      }
    };
  };

  // Handle password update confirmation - logout and redirect to auth flow
  const handleConfirm = async () => {
    try {
      // Logout user and redirect to password reset
      await auth.logout(['/auth', '/reset-password']);
      
      // Close popup after successful logout
      onClose();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still close popup even if logout fails
      onClose();
    }
  };

  // Handle remind me later functionality
  const handleRemindLater = () => {
    onRemindLater?.();
    onClose();
  };

  // Get variant-specific styling
  const getVariantStyles = (variant: PopupVariant) => {
    const variants = {
      default: 'border-gray-200',
      success: 'border-success-200',
      warning: 'border-warning-200',
      error: 'border-error-200',
      info: 'border-primary-200',
      confirmation: 'border-primary-200',
      authentication: 'border-warning-200', // Password security uses warning colors
      announcement: 'border-primary-200',
    };
    
    return variants[variant] || variants.default;
  };

  // Get size configuration
  const sizeConfig = POPUP_SIZE_CONFIG[size];

  // Animation classes for Headless UI transitions
  const getAnimationClasses = () => {
    if (animation.preset === 'fade') {
      return {
        enter: 'ease-out duration-300',
        enterFrom: 'opacity-0',
        enterTo: 'opacity-100',
        leave: 'ease-in duration-200',
        leaveFrom: 'opacity-100',
        leaveTo: 'opacity-0',
      };
    }
    
    return {
      enter: 'ease-out duration-300',
      enterFrom: 'opacity-0 scale-95',
      enterTo: 'opacity-100 scale-100',
      leave: 'ease-in duration-200',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-95',
    };
  };

  const animationClasses = getAnimationClasses();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={dismissOnClickOutside ? onClose : () => {}}
        role={accessibility.role}
        aria-labelledby="popup-title"
        aria-describedby="popup-description"
        data-testid={testId}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter={animationClasses.enter}
          enterFrom={animationClasses.enterFrom}
          enterTo={animationClasses.enterTo}
          leave={animationClasses.leave}
          leaveFrom={animationClasses.leaveFrom}
          leaveTo={animationClasses.leaveTo}
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter={animationClasses.enter}
              enterFrom={animationClasses.enterFrom}
              enterTo={animationClasses.enterTo}
              leave={animationClasses.leave}
              leaveFrom={animationClasses.leaveFrom}
              leaveTo={animationClasses.leaveTo}
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all',
                  'border-2',
                  getVariantStyles(variant),
                  sizeConfig.padding,
                  className
                )}
                style={{ maxWidth: sizeConfig.maxWidth }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h2"
                    id="popup-title"
                    className="text-xl font-semibold text-gray-900 leading-6"
                  >
                    {title}
                  </Dialog.Title>
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      className={cn(
                        'rounded-md p-2 text-gray-400 hover:text-gray-500',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                        'transition-colors duration-200'
                      )}
                      onClick={handleButtonClick('close')}
                      aria-label="Close popup"
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div id="popup-description" className="mb-8">
                  {typeof children === 'string' ? (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {children || defaultMessage}
                    </p>
                  ) : (
                    children
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3">
                  {/* Custom actions or default actions */}
                  {actions ? (
                    actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'secondary'}
                        disabled={action.disabled}
                        onClick={handleButtonClick('custom', action.onClick)}
                        aria-label={action.ariaLabel}
                        className="sm:min-w-[140px]"
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </Button>
                    ))
                  ) : (
                    <>
                      {/* Remind me later button - conditionally rendered */}
                      {showRemindMeLater && (
                        <Button
                          variant="outline"
                          onClick={handleButtonClick('remindLater')}
                          className="sm:min-w-[140px]"
                          aria-label="Remind me later to update password"
                        >
                          Remind me later
                        </Button>
                      )}
                      
                      {/* Primary action button */}
                      <Button
                        variant="primary"
                        onClick={handleButtonClick('confirm')}
                        className="sm:min-w-[140px]"
                        aria-label="Update password now"
                        autoFocus={accessibility.initialFocus === 'confirm'}
                      >
                        Update Password Now
                      </Button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Default export for easier importing
export default Popup;

// Named exports for specific use cases
export type { PopupProps } from './types';
export { type PopupVariant, type PopupSize } from './types';