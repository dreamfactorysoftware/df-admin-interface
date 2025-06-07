"use client";

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { Button, IconButton } from '@/components/ui/button/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type {
  PopupProps,
  PopupConfig,
  PopupVariant,
  PopupSize,
  PopupButtonType,
  PopupAnimationConfig,
  PopupAccessibilityConfig,
  PopupThemeConfig,
  PopupI18nConfig,
  AuthWorkflowCallbacks,
  AuthRedirectReason,
  LogoutReason,
} from './types';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Default popup configuration values ensuring WCAG 2.1 AA compliance
 */
const DEFAULT_POPUP_CONFIG: Required<PopupConfig> = {
  message: 'Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.',
  showRemindMeLater: true,
  title: 'Password Security Notice',
  variant: 'authentication',
  size: 'md',
  dismissOnClickOutside: false,
  showCloseButton: true,
  autoCloseTimeout: 0,
  className: '',
  accessibility: {
    role: 'alertdialog',
    ariaLabel: 'Password Security Notice',
    trapFocus: true,
    initialFocus: 'first',
    announceOnOpen: true,
    modal: true,
  },
  animation: {
    preset: 'fade',
    duration: 200,
    easing: 'ease-out',
    animateBackdrop: true,
  },
};

/**
 * Authentication redirect routes mapping
 */
const AUTH_ROUTES = {
  LOGIN: '/login',
  RESET_PASSWORD: '/auth/reset-password',
  UNAUTHORIZED: '/unauthorized',
  MAINTENANCE: '/maintenance',
} as const;

/**
 * Internationalization keys for popup content
 */
const I18N_KEYS = {
  TITLE: 'popup.passwordSecurity.title',
  MESSAGE: 'popup.passwordSecurity.message',
  REMIND_LATER: 'popup.actions.remindLater',
  UPDATE_NOW: 'popup.actions.updateNow',
  CLOSE: 'popup.actions.close',
  CONFIRM: 'popup.actions.confirm',
  CANCEL: 'popup.actions.cancel',
} as const;

/**
 * WCAG 2.1 AA compliant variant styles using design tokens
 */
const POPUP_VARIANT_STYLES = {
  default: {
    container: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
    header: 'text-gray-900 dark:text-gray-100',
    content: 'text-gray-700 dark:text-gray-300',
    backdrop: 'bg-gray-500/75',
  },
  success: {
    container: 'bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800',
    header: 'text-success-900 dark:text-success-100',
    content: 'text-success-800 dark:text-success-200',
    backdrop: 'bg-success-500/75',
  },
  warning: {
    container: 'bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800',
    header: 'text-warning-900 dark:text-warning-100',
    content: 'text-warning-800 dark:text-warning-200',
    backdrop: 'bg-warning-500/75',
  },
  error: {
    container: 'bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800',
    header: 'text-error-900 dark:text-error-100',
    content: 'text-error-800 dark:text-error-200',
    backdrop: 'bg-error-500/75',
  },
  info: {
    container: 'bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800',
    header: 'text-primary-900 dark:text-primary-100',
    content: 'text-primary-800 dark:text-primary-200',
    backdrop: 'bg-primary-500/75',
  },
  confirmation: {
    container: 'bg-white dark:bg-gray-900 border-2 border-primary-600',
    header: 'text-gray-900 dark:text-gray-100',
    content: 'text-gray-700 dark:text-gray-300',
    backdrop: 'bg-gray-500/75',
  },
  authentication: {
    container: 'bg-white dark:bg-gray-900 border-2 border-primary-600',
    header: 'text-primary-700 dark:text-primary-300',
    content: 'text-gray-700 dark:text-gray-300',
    backdrop: 'bg-gray-900/75',
  },
  announcement: {
    container: 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl',
    header: 'text-gray-900 dark:text-gray-100',
    content: 'text-gray-700 dark:text-gray-300',
    backdrop: 'bg-gray-500/75',
  },
} as const;

/**
 * Size configurations with minimum WCAG touch targets
 */
const POPUP_SIZE_STYLES = {
  xs: 'max-w-xs p-4',
  sm: 'max-w-sm p-6',
  md: 'max-w-md p-6',
  lg: 'max-w-lg p-8',
  xl: 'max-w-xl p-8',
  full: 'max-w-full p-8',
} as const;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Simple translation function placeholder
 * In a real implementation, this would integrate with react-i18next
 */
function useTranslation() {
  const translate = useCallback((key: string, params?: Record<string, any>) => {
    // Simplified translation mapping for demo
    const translations: Record<string, string> = {
      [I18N_KEYS.TITLE]: 'Password Security Notice',
      [I18N_KEYS.MESSAGE]: 'Your current password is shorter than recommended (less than 17 characters). For better security, we recommend updating your password to a longer one.',
      [I18N_KEYS.REMIND_LATER]: 'Remind me later',
      [I18N_KEYS.UPDATE_NOW]: 'Update Password Now',
      [I18N_KEYS.CLOSE]: 'Close',
      [I18N_KEYS.CONFIRM]: 'Confirm',
      [I18N_KEYS.CANCEL]: 'Cancel',
    };

    let translation = translations[key] || key;
    
    // Simple parameter substitution
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }

    return translation;
  }, []);

  return { t: translate };
}

/**
 * Announces content to screen readers using aria-live regions
 */
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only fixed -top-px -left-px w-px h-px overflow-hidden';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Clean up after announcement
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
}

/**
 * Generates unique IDs for accessibility labeling
 */
function generateId(prefix: string = 'popup'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// MAIN POPUP COMPONENT
// =============================================================================

/**
 * Main React popup component implementing password security notice functionality
 * 
 * Features:
 * - WCAG 2.1 AA accessibility with focus trapping and keyboard navigation
 * - Headless UI Dialog primitive for robust modal behavior
 * - Tailwind CSS 4.1+ styling with design tokens
 * - Configurable message content and actions
 * - Authentication redirect workflow integration
 * - Smooth animations and responsive design
 * - Internationalization support
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Popup isOpen={isOpen} onClose={handleClose}>
 *   Your password security notice content
 * </Popup>
 * 
 * // With configuration
 * <Popup
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   variant="authentication"
 *   size="md"
 *   showRemindMeLater={true}
 *   onRemindLater={handleRemindLater}
 *   dismissOnClickOutside={false}
 * >
 *   Custom security message content
 * </Popup>
 * ```
 */
export function Popup({
  children,
  isOpen,
  onClose,
  onRemindLater,
  onOpen,
  onButtonClick,
  title,
  variant = 'authentication',
  size = 'md',
  showRemindMeLater = true,
  dismissOnClickOutside = false,
  showCloseButton = true,
  autoCloseTimeout = 0,
  className,
  accessibility,
  animation,
  theme,
  i18n,
  actions,
  portalRef,
  zIndex = 1000,
  'data-testid': dataTestId = 'popup',
  ...props
}: PopupProps) {
  // =============================================================================
  // HOOKS AND STATE
  // =============================================================================

  const router = useRouter();
  const { logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  // Component state
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Refs for accessibility
  const titleId = useRef(generateId('popup-title')).current;
  const descriptionId = useRef(generateId('popup-description')).current;
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  
  // Auto-close timer
  const autoCloseTimerRef = useRef<NodeJS.Timeout>();

  // =============================================================================
  // CONFIGURATION MERGING
  // =============================================================================

  const config = {
    ...DEFAULT_POPUP_CONFIG,
    title,
    variant,
    size,
    showRemindMeLater,
    dismissOnClickOutside,
    showCloseButton,
    autoCloseTimeout,
    className,
    accessibility: { ...DEFAULT_POPUP_CONFIG.accessibility, ...accessibility },
    animation: { ...DEFAULT_POPUP_CONFIG.animation, ...animation },
  };

  const variantStyles = POPUP_VARIANT_STYLES[config.variant];
  const sizeStyles = POPUP_SIZE_STYLES[config.size];

  // =============================================================================
  // EFFECT HANDLERS
  // =============================================================================

  /**
   * Handle popup open/close state changes
   */
  useEffect(() => {
    if (isOpen && !isVisible) {
      setIsVisible(true);
      setIsClosing(false);
      
      // Announce popup opening to screen readers
      if (config.accessibility.announceOnOpen) {
        const message = config.accessibility.openAnnouncement || 
          `${t(I18N_KEYS.TITLE)} dialog opened`;
        announceToScreenReader(message, 'assertive');
      }
      
      // Call onOpen callback
      onOpen?.();
      
      // Set up auto-close timer
      if (config.autoCloseTimeout > 0) {
        autoCloseTimerRef.current = setTimeout(() => {
          handleClose('timeout');
        }, config.autoCloseTimeout);
      }
    } else if (!isOpen && isVisible) {
      setIsClosing(true);
      
      // Clear auto-close timer
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = undefined;
      }
      
      // Delay hiding to allow exit animation
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, config.animation.duration);
    }
  }, [isOpen, isVisible, config, onOpen, t]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  /**
   * Enhanced close handler with button type tracking
   */
  const handleClose = useCallback((buttonType: PopupButtonType | 'dismissal' | 'timeout' = 'close') => {
    onButtonClick?.(buttonType as PopupButtonType);
    onClose();
  }, [onClose, onButtonClick]);

  /**
   * Handle "Remind me later" action
   */
  const handleRemindLater = useCallback(() => {
    onRemindLater?.();
    handleClose('remindLater');
  }, [onRemindLater, handleClose]);

  /**
   * Handle authentication redirect (Update Password Now)
   */
  const handleAuthRedirect = useCallback(async () => {
    try {
      // Log out user and redirect to password reset
      if (isAuthenticated) {
        await logout();
      }
      
      // Navigate to password reset page
      router.push(AUTH_ROUTES.RESET_PASSWORD);
      
      // Announce action to screen readers
      announceToScreenReader('Redirecting to password update page', 'assertive');
      
      handleClose('confirm');
    } catch (error) {
      console.error('Failed to handle auth redirect:', error);
      
      // Fallback: just navigate to login
      router.push(AUTH_ROUTES.LOGIN);
      handleClose('confirm');
    }
  }, [isAuthenticated, logout, router, handleClose]);

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = useCallback(() => {
    if (config.dismissOnClickOutside) {
      handleClose('dismissal');
    }
  }, [config.dismissOnClickOutside, handleClose]);

  /**
   * Handle keyboard events for accessibility
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        if (config.dismissOnClickOutside) {
          event.preventDefault();
          handleClose('dismissal');
        }
        break;
      
      case 'Tab':
        // Focus management is handled by Headless UI Dialog
        break;
      
      default:
        break;
    }
  }, [config.dismissOnClickOutside, handleClose]);

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  /**
   * Render popup actions (buttons)
   */
  const renderActions = () => {
    // Use custom actions if provided
    if (actions && actions.length > 0) {
      return (
        <div className="flex justify-center gap-3 mt-6">
          {actions.map((action, index) => (
            <Button
              key={index}
              ref={action.type === 'confirm' ? confirmButtonRef : 
                   action.type === 'cancel' ? cancelButtonRef : undefined}
              variant={action.variant || 'primary'}
              disabled={action.disabled}
              loading={action.loading}
              onClick={action.onClick}
              ariaLabel={action.ariaLabel}
              className="min-w-[120px]"
              data-testid={`popup-action-${action.type}`}
            >
              {action.icon && (
                <span className="mr-2" aria-hidden="true">
                  {action.icon}
                </span>
              )}
              {action.label}
            </Button>
          ))}
        </div>
      );
    }

    // Default authentication popup actions
    return (
      <div className="flex justify-center gap-3 mt-6">
        {config.showRemindMeLater && (
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={handleRemindLater}
            className="min-w-[120px]"
            data-testid="popup-remind-later"
            ariaLabel={t(I18N_KEYS.REMIND_LATER)}
          >
            {t(I18N_KEYS.REMIND_LATER)}
          </Button>
        )}
        <Button
          ref={confirmButtonRef}
          variant="primary"
          onClick={handleAuthRedirect}
          className="min-w-[120px]"
          data-testid="popup-update-now"
          ariaLabel={t(I18N_KEYS.UPDATE_NOW)}
        >
          {t(I18N_KEYS.UPDATE_NOW)}
        </Button>
      </div>
    );
  };

  /**
   * Render close button
   */
  const renderCloseButton = () => {
    if (!config.showCloseButton) return null;

    return (
      <div className="absolute top-4 right-4">
        <IconButton
          icon={<span className="text-lg" aria-hidden="true">×</span>}
          ariaLabel={t(I18N_KEYS.CLOSE)}
          variant="ghost"
          size="icon-md"
          onClick={() => handleClose('close')}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
          data-testid="popup-close"
        />
      </div>
    );
  };

  // =============================================================================
  // RENDER COMPONENT
  // =============================================================================

  if (!isVisible && !isOpen) {
    return null;
  }

  return (
    <Transition
      show={isOpen}
      as={Fragment}
      appear
    >
      <Dialog
        as="div"
        className="relative"
        style={{ zIndex }}
        onClose={config.dismissOnClickOutside ? handleClose : () => {}}
        initialFocus={config.accessibility.initialFocus === 'cancel' ? cancelButtonRef :
                     config.accessibility.initialFocus === 'confirm' ? confirmButtonRef :
                     initialFocusRef}
        data-testid={dataTestId}
        {...props}
      >
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className={cn(
              "fixed inset-0 transition-opacity",
              variantStyles.backdrop,
              config.animation.animateBackdrop && "backdrop-blur-sm"
            )}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        </Transition.Child>

        {/* Popup container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel
                className={cn(
                  // Base styles
                  "relative w-full rounded-lg shadow-xl transform transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
                  
                  // Variant and size styles
                  variantStyles.container,
                  sizeStyles,
                  
                  // Custom className
                  className
                )}
                onKeyDown={handleKeyDown}
                role={config.accessibility.role}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                aria-modal={config.accessibility.modal}
              >
                {/* Close button */}
                {renderCloseButton()}

                {/* Header */}
                <div className="mb-4">
                  <Dialog.Title
                    as="h2"
                    id={titleId}
                    className={cn(
                      "text-lg font-semibold leading-6",
                      variantStyles.header
                    )}
                  >
                    {config.title || t(I18N_KEYS.TITLE)}
                  </Dialog.Title>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <div
                    id={descriptionId}
                    className={cn(
                      "text-sm leading-5",
                      variantStyles.content
                    )}
                  >
                    {children || config.message || t(I18N_KEYS.MESSAGE)}
                  </div>
                </div>

                {/* Actions */}
                {renderActions()}

                {/* Hidden button for initial focus if needed */}
                <button
                  ref={initialFocusRef}
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// =============================================================================
// COMPOUND COMPONENTS AND EXPORTS
// =============================================================================

/**
 * Password security popup with pre-configured authentication workflow
 */
export interface PasswordSecurityPopupProps extends Omit<PopupProps, 'children' | 'variant'> {
  /** Custom security message */
  message?: string;
}

export function PasswordSecurityPopup({
  message,
  ...props
}: PasswordSecurityPopupProps) {
  const { t } = useTranslation();
  
  return (
    <Popup
      variant="authentication"
      title={t(I18N_KEYS.TITLE)}
      accessibility={{
        role: 'alertdialog',
        ariaLabel: t(I18N_KEYS.TITLE),
        announceOnOpen: true,
      }}
      {...props}
    >
      {message || t(I18N_KEYS.MESSAGE)}
    </Popup>
  );
}

/**
 * Confirmation popup with pre-configured actions
 */
export interface ConfirmationPopupProps extends Omit<PopupProps, 'children' | 'variant'> {
  /** Confirmation message */
  message: string;
  /** Confirm button label */
  confirmLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Confirm action handler */
  onConfirm: () => void;
  /** Cancel action handler */
  onCancel?: () => void;
}

export function ConfirmationPopup({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  onClose,
  ...props
}: ConfirmationPopupProps) {
  const { t } = useTranslation();

  const actions = [
    {
      label: cancelLabel || t(I18N_KEYS.CANCEL),
      type: 'cancel' as PopupButtonType,
      variant: 'outline' as const,
      onClick: () => {
        onCancel?.();
        onClose();
      },
    },
    {
      label: confirmLabel || t(I18N_KEYS.CONFIRM),
      type: 'confirm' as PopupButtonType,
      variant: 'primary' as const,
      onClick: () => {
        onConfirm();
        onClose();
      },
    },
  ];

  return (
    <Popup
      variant="confirmation"
      actions={actions}
      onClose={onClose}
      accessibility={{
        role: 'alertdialog',
        initialFocus: 'cancel',
      }}
      {...props}
    >
      {message}
    </Popup>
  );
}

// Export main component as default
export default Popup;

// Export all types for external usage
export type {
  PopupProps,
  PopupConfig,
  PopupVariant,
  PopupSize,
  PopupButtonType,
  PopupAnimationConfig,
  PopupAccessibilityConfig,
  PopupThemeConfig,
  PopupI18nConfig,
  AuthWorkflowCallbacks,
  AuthRedirectReason,
  LogoutReason,
};

// Export configuration constants
export {
  DEFAULT_POPUP_CONFIG,
  AUTH_ROUTES,
  I18N_KEYS,
  POPUP_VARIANT_STYLES,
  POPUP_SIZE_STYLES,
};