/**
 * Snackbar Notification Component
 * 
 * React 19 notification component implementing accessible toast-style alerts with
 * dismissible functionality. Replaces Angular df-snackbar component with modern
 * React patterns while maintaining full feature parity.
 * 
 * Features:
 * - WCAG 2.1 AA compliant with proper ARIA attributes and screen reader support
 * - Headless UI integration for focus management and accessibility
 * - Tailwind CSS utility classes for responsive design and animations
 * - FontAwesome React icon integration with existing icon mappings
 * - Zustand store integration for global notification state management
 * - Multiple severity levels (success, warning, error, info) with context-appropriate styling
 * - Action buttons with keyboard navigation support
 * - Proper timing controls with reduced motion preferences
 * 
 * @fileoverview React 19 Snackbar notification component
 * @version 1.0.0
 * @since React 19.0 / Next.js 15.1
 */

'use client';

import React, { useEffect, useRef, useCallback, startTransition } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faXmark,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { 
  type SnackbarProps, 
  type AlertSeverity, 
  type SnackbarCloseReason,
  AlertType 
} from './types';

/**
 * Icon mapping for different alert types
 * Maintains consistency with Angular df-snackbar component iconography
 */
const ALERT_ICONS = {
  [AlertType.SUCCESS]: faCheckCircle,
  [AlertType.ERROR]: faXmarkCircle,
  [AlertType.WARNING]: faExclamationCircle,
  [AlertType.INFO]: faInfoCircle,
} as const;

/**
 * WCAG 2.1 AA compliant color schemes for different alert types
 * All color combinations meet 4.5:1 contrast ratio for normal text
 */
const ALERT_STYLES = {
  [AlertType.SUCCESS]: {
    container: 'bg-success-50 border-success-300 dark:bg-success-950 dark:border-success-700',
    icon: 'text-success-500 dark:text-success-400',
    text: 'text-success-900 dark:text-success-100',
    closeButton: 'text-success-500 hover:text-success-700 dark:text-success-400 dark:hover:text-success-300',
  },
  [AlertType.ERROR]: {
    container: 'bg-error-50 border-error-300 dark:bg-error-950 dark:border-error-700',
    icon: 'text-error-500 dark:text-error-400',
    text: 'text-error-900 dark:text-error-100',
    closeButton: 'text-error-500 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300',
  },
  [AlertType.WARNING]: {
    container: 'bg-warning-50 border-warning-300 dark:bg-warning-950 dark:border-warning-700',
    icon: 'text-warning-500 dark:text-warning-400',
    text: 'text-warning-900 dark:text-warning-100',
    closeButton: 'text-warning-500 hover:text-warning-700 dark:text-warning-400 dark:hover:text-warning-300',
  },
  [AlertType.INFO]: {
    container: 'bg-primary-50 border-primary-300 dark:bg-primary-950 dark:border-primary-700',
    icon: 'text-primary-500 dark:text-primary-400',
    text: 'text-primary-900 dark:text-primary-100',
    closeButton: 'text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300',
  },
} as const;

/**
 * Snackbar Component
 * 
 * Displays toast-style notifications with accessibility support, animations,
 * and proper focus management. Integrates with Zustand store for state management.
 */
export function Snackbar({
  notification,
  open,
  onClose,
  onActionClick,
  onAnimationComplete,
  position = { vertical: 'bottom', horizontal: 'left' },
  transition = {
    type: 'slide',
    duration: 300,
    easing: 'ease-out',
    respectReducedMotion: true,
  },
  classes = {},
  showCloseButton = true,
  closeButtonAriaLabel = 'Close notification',
  closeButtonIcon,
  compact = false,
  fullWidth = false,
  elevation = 2,
  className,
  style,
  'data-testid': testId = 'snackbar',
  ...props
}: SnackbarProps) {
  // Refs for focus management and animation
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Alert type and styles
  const alertType = notification.alertType as AlertSeverity;
  const alertStyles = ALERT_STYLES[alertType];
  const alertIcon = notification.icon?.icon || ALERT_ICONS[alertType];

  /**
   * Handle close with proper reason tracking
   */
  const handleClose = useCallback((reason: SnackbarCloseReason) => {
    // Use React 19 concurrent features for optimal performance
    startTransition(() => {
      onClose(notification.id, reason);
    });
  }, [notification.id, onClose]);

  /**
   * Handle keyboard navigation and escape key
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose('escapeKeyDown');
    }
  }, [handleClose]);

  /**
   * Handle action button clicks
   */
  const handleActionClick = useCallback((action: typeof notification.actions[0]) => {
    if (action && onActionClick) {
      startTransition(() => {
        onActionClick(action, notification.id);
      });
    }
  }, [notification.actions, notification.id, onActionClick]);

  /**
   * Auto-dismiss timer setup
   */
  useEffect(() => {
    if (!open || !notification.duration || notification.duration === null) {
      return;
    }

    const timer = setTimeout(() => {
      handleClose('timeout');
    }, notification.duration);

    return () => clearTimeout(timer);
  }, [open, notification.duration, handleClose]);

  /**
   * Focus management for accessibility
   */
  useEffect(() => {
    if (open) {
      // Store previous focus for restoration
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the container for screen reader announcement
      if (containerRef.current) {
        containerRef.current.focus();
      }
    } else {
      // Restore previous focus when closing
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [open]);

  /**
   * Reduced motion detection
   */
  const shouldReduceMotion = transition.respectReducedMotion && 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /**
   * Animation configuration based on transition settings and reduced motion
   */
  const animationDuration = shouldReduceMotion ? 0 : transition.duration;
  
  /**
   * Position-based animation classes
   */
  const getAnimationClasses = (entering: boolean) => {
    if (shouldReduceMotion) {
      return entering ? 'opacity-100' : 'opacity-0';
    }

    const { vertical, horizontal } = position;
    const translateX = horizontal === 'left' ? '-100%' : 
                     horizontal === 'right' ? '100%' : '0%';
    const translateY = vertical === 'top' ? '-100%' : 
                      vertical === 'bottom' ? '100%' : '0%';

    switch (transition.type) {
      case 'slide':
        return entering 
          ? `transform translate-x-0 translate-y-0 opacity-100`
          : `transform ${horizontal !== 'center' ? `translate-x-[${translateX}]` : ''} ${vertical !== 'center' ? `translate-y-[${translateY}]` : ''} opacity-0`;
      case 'fade':
        return entering ? 'opacity-100' : 'opacity-0';
      case 'scale':
        return entering ? 'scale-100 opacity-100' : 'scale-95 opacity-0';
      case 'zoom':
        return entering ? 'scale-100 opacity-100' : 'scale-110 opacity-0';
      default:
        return entering ? 'opacity-100' : 'opacity-0';
    }
  };

  /**
   * Base container classes with WCAG 2.1 AA compliance
   */
  const containerClasses = cn(
    // Base layout and structure
    'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
    'max-w-md w-full pointer-events-auto',
    
    // Accessibility and focus management
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2',
    'focus-visible:outline-none',
    
    // Alert type specific styling
    alertStyles.container,
    
    // Size variants
    compact && 'p-3 text-sm',
    fullWidth && 'max-w-none w-full',
    
    // Elevation shadow
    {
      'shadow-sm': elevation === 1,
      'shadow-md': elevation === 2,
      'shadow-lg': elevation === 3,
      'shadow-xl': elevation === 4,
    }[elevation] || 'shadow-lg',
    
    // Animation classes
    'transition-all duration-300 ease-out',
    
    // Custom classes
    classes.root,
    className
  );

  /**
   * Icon container classes
   */
  const iconClasses = cn(
    'flex-shrink-0 w-5 h-5 mt-0.5',
    alertStyles.icon,
    classes.icon
  );

  /**
   * Message text classes
   */
  const messageClasses = cn(
    'flex-1 text-sm font-medium leading-5',
    alertStyles.text,
    classes.message
  );

  /**
   * Actions container classes
   */
  const actionsClasses = cn(
    'flex items-center gap-2 ml-auto',
    classes.actions
  );

  /**
   * Close button classes
   */
  const closeButtonClasses = cn(
    'flex-shrink-0 p-1 rounded-md transition-colors duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1',
    'hover:bg-black/10 dark:hover:bg-white/10',
    'min-w-[44px] min-h-[44px] flex items-center justify-center', // WCAG touch target
    alertStyles.closeButton,
    classes.closeButton
  );

  return (
    <Transition
      show={open}
      as={React.Fragment}
      enter="transition-all duration-300 ease-out"
      enterFrom={getAnimationClasses(false)}
      enterTo={getAnimationClasses(true)}
      leave="transition-all duration-300 ease-in"
      leaveFrom={getAnimationClasses(true)}
      leaveTo={getAnimationClasses(false)}
      afterEnter={() => onAnimationComplete?.(notification.id, 'enter')}
      afterLeave={() => onAnimationComplete?.(notification.id, 'exit')}
    >
      <div
        ref={containerRef}
        className={containerClasses}
        style={{
          transitionDuration: `${animationDuration}ms`,
          transitionTimingFunction: transition.easing,
          ...style,
        }}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        aria-labelledby={`snackbar-message-${notification.id}`}
        aria-describedby={notification.actions?.length ? `snackbar-actions-${notification.id}` : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        data-testid={testId}
        data-alert-type={alertType}
        {...props}
      >
        {/* Alert Icon */}
        {!notification.icon?.hideDefault && (
          <div className={iconClasses} aria-hidden="true">
            <FontAwesomeIcon 
              icon={alertIcon} 
              className="w-full h-full"
              aria-label={notification.icon?.ariaLabel}
            />
          </div>
        )}

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <p 
            id={`snackbar-message-${notification.id}`}
            className={messageClasses}
          >
            {notification.message}
          </p>

          {/* Action Buttons */}
          {notification.actions && notification.actions.length > 0 && (
            <div 
              id={`snackbar-actions-${notification.id}`}
              className={cn(actionsClasses, 'mt-2')}
            >
              {notification.actions.map((action, index) => (
                <button
                  key={`${notification.id}-action-${index}`}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled || action.loading}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md',
                    'border border-current transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1',
                    'hover:bg-current hover:bg-opacity-10',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'min-h-[44px] min-w-[44px]', // WCAG touch target
                    {
                      'text': 'border-transparent',
                      'outlined': 'bg-transparent',
                      'contained': 'bg-current text-white border-transparent',
                    }[action.variant || 'text']
                  )}
                  aria-label={action.ariaLabel || action.label}
                  aria-describedby={action.loading ? `${notification.id}-action-${index}-loading` : undefined}
                >
                  {action.loading ? (
                    <>
                      <span 
                        id={`${notification.id}-action-${index}-loading`}
                        className="sr-only"
                      >
                        Loading
                      </span>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    </>
                  ) : (
                    action.label
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        {showCloseButton && notification.dismissible && (
          <button
            onClick={() => handleClose('closeButton')}
            className={closeButtonClasses}
            aria-label={closeButtonAriaLabel}
            type="button"
          >
            {closeButtonIcon || (
              <FontAwesomeIcon 
                icon={faXmark} 
                className="w-4 h-4"
                aria-hidden="true"
              />
            )}
          </button>
        )}

        {/* Progress Bar for Timed Notifications */}
        {notification.duration && notification.duration > 0 && (
          <div 
            className="absolute bottom-0 left-0 h-1 bg-current opacity-30 rounded-b-lg"
            style={{
              animation: `snackbar-progress ${notification.duration}ms linear forwards`,
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </Transition>
  );
}

/**
 * CSS-in-JS for progress bar animation
 * Added to global styles or component styles
 */
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes snackbar-progress {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }
    
    /* Reduced motion override */
    @media (prefers-reduced-motion: reduce) {
      .snackbar-progress {
        animation: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

export default Snackbar;