/**
 * Alert Component System - React 19 Implementation
 * 
 * Comprehensive Alert compound component migrated from Angular df-alert and df-error.
 * Implements WCAG 2.1 AA accessibility standards with React 19 patterns and Tailwind CSS 4.1+.
 * 
 * Features:
 * - Compound component pattern (Alert.Icon, Alert.Content, Alert.Dismiss, Alert.Actions)
 * - WCAG 2.1 AA compliant with proper ARIA attributes and keyboard navigation
 * - Heroicons integration replacing FontAwesome per technology stack requirements
 * - Support for success, error, warning, and info variants with proper contrast ratios
 * - Dismissible functionality with auto-dismiss and confirmation options
 * - Responsive design with mobile-first approach
 * - Integration with existing Button component architecture
 * - Full TypeScript support with comprehensive type definitions
 * 
 * @fileoverview React Alert compound component system
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see WCAG 2.1 AA Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/
 */

'use client';

import React, { 
  forwardRef, 
  createContext, 
  useContext, 
  useEffect, 
  useRef, 
  useState,
  useCallback,
  type ReactNode,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
} from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  type AlertProps,
  type AlertIconProps,
  type AlertContentProps,
  type AlertDismissProps,
  type AlertActionsProps,
  type AlertType,
  type AlertVariant,
  type AlertSize,
  ALERT_DEFAULTS,
  ALERT_TYPE_CONFIGS,
} from './types';

// =============================================================================
// ALERT CONTEXT
// =============================================================================

/**
 * Alert Context for sharing state between compound components
 * Enables prop drilling avoidance and consistent component communication
 */
interface AlertContextValue {
  type: AlertType;
  variant: AlertVariant;
  size: AlertSize;
  dismissible: boolean;
  onDismiss?: () => void;
  onBeforeDismiss?: () => boolean | Promise<boolean>;
  visible: boolean;
  alertId: string;
  compact: boolean;
  showIcon: boolean;
  announcement?: string;
}

const AlertContext = createContext<AlertContextValue | null>(null);

/**
 * Hook to access Alert context with error handling
 * Ensures components are used within Alert compound component
 */
const useAlertContext = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error(
      'Alert compound components must be used within an Alert component. ' +
      'Make sure you are using Alert.Icon, Alert.Content, Alert.Dismiss, or Alert.Actions inside an Alert component.'
    );
  }
  return context;
};

// =============================================================================
// ALERT STYLING SYSTEM
// =============================================================================

/**
 * Alert variant styling with WCAG 2.1 AA compliant color combinations
 * All color tokens meet minimum 4.5:1 contrast ratio for normal text
 * and 3:1 for UI components and large text
 */
const alertVariants = {
  // Base styles applied to all variants
  base: cn(
    "relative flex w-full rounded-lg border transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
    "aria-live-region" // Custom class for screen reader announcements
  ),
  
  // Type-specific color schemes with WCAG AA compliance
  type: {
    success: {
      soft: cn(
        "bg-success-50 border-success-200 text-success-900",
        "dark:bg-success-950/50 dark:border-success-800 dark:text-success-100"
      ),
      filled: cn(
        "bg-success-600 border-success-600 text-white",
        "dark:bg-success-700 dark:border-success-700"
      ),
      outlined: cn(
        "bg-transparent border-success-600 text-success-700",
        "dark:border-success-500 dark:text-success-400"
      ),
      banner: cn(
        "bg-success-100 border-success-300 text-success-800",
        "dark:bg-success-900/30 dark:border-success-700 dark:text-success-200"
      ),
    },
    error: {
      soft: cn(
        "bg-error-50 border-error-200 text-error-900",
        "dark:bg-error-950/50 dark:border-error-800 dark:text-error-100"
      ),
      filled: cn(
        "bg-error-600 border-error-600 text-white",
        "dark:bg-error-700 dark:border-error-700"
      ),
      outlined: cn(
        "bg-transparent border-error-600 text-error-700",
        "dark:border-error-500 dark:text-error-400"
      ),
      banner: cn(
        "bg-error-100 border-error-300 text-error-800",
        "dark:bg-error-900/30 dark:border-error-700 dark:text-error-200"
      ),
    },
    warning: {
      soft: cn(
        "bg-warning-50 border-warning-200 text-warning-900",
        "dark:bg-warning-950/50 dark:border-warning-800 dark:text-warning-100"
      ),
      filled: cn(
        "bg-warning-600 border-warning-600 text-white",
        "dark:bg-warning-700 dark:border-warning-700"
      ),
      outlined: cn(
        "bg-transparent border-warning-600 text-warning-700",
        "dark:border-warning-500 dark:text-warning-400"
      ),
      banner: cn(
        "bg-warning-100 border-warning-300 text-warning-800",
        "dark:bg-warning-900/30 dark:border-warning-700 dark:text-warning-200"
      ),
    },
    info: {
      soft: cn(
        "bg-primary-50 border-primary-200 text-primary-900",
        "dark:bg-primary-950/50 dark:border-primary-800 dark:text-primary-100"
      ),
      filled: cn(
        "bg-primary-600 border-primary-600 text-white",
        "dark:bg-primary-700 dark:border-primary-700"
      ),
      outlined: cn(
        "bg-transparent border-primary-600 text-primary-700",
        "dark:border-primary-500 dark:text-primary-400"
      ),
      banner: cn(
        "bg-primary-100 border-primary-300 text-primary-800",
        "dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-200"
      ),
    },
  },
  
  // Size variants with WCAG touch target compliance
  size: {
    sm: "p-3 text-sm gap-2",
    md: "p-4 text-base gap-3",
    lg: "p-6 text-lg gap-4",
  },
  
  // Position variants for different layout contexts
  position: {
    inline: "",
    floating: "fixed z-50",
    sticky: "sticky top-0 z-40",
    toast: "fixed z-50 max-w-sm",
  },
  
  // Compact variant for space-constrained layouts
  compact: "p-2 text-sm gap-2",
  
  // Full width variant
  fullWidth: "w-full",
  
  // Animation variants
  animation: {
    fade: "animate-fade-in",
    slide: "animate-slide-in",
    scale: "animate-scale-in",
    none: "",
  },
};

/**
 * Generate alert classes based on props
 * Combines variant styling with accessibility considerations
 */
const getAlertClasses = ({
  type,
  variant,
  size,
  position,
  compact,
  fullWidth,
  animation,
  className,
}: {
  type: AlertType;
  variant: AlertVariant;
  size: AlertSize;
  position?: string;
  compact?: boolean;
  fullWidth?: boolean;
  animation?: string;
  className?: string;
}) => {
  return cn(
    alertVariants.base,
    alertVariants.type[type][variant],
    compact ? alertVariants.compact : alertVariants.size[size],
    position && alertVariants.position[position as keyof typeof alertVariants.position],
    fullWidth && alertVariants.fullWidth,
    animation && alertVariants.animation[animation as keyof typeof alertVariants.animation],
    className
  );
};

// =============================================================================
// ALERT ICON MAPPING
// =============================================================================

/**
 * Type-to-icon mapping using Heroicons per technology stack requirements
 * Provides both outline and solid variants for different styling needs
 */
const alertIcons = {
  success: {
    outline: CheckCircleIcon,
    solid: CheckCircleIconSolid,
  },
  error: {
    outline: ExclamationCircleIcon,
    solid: ExclamationCircleIconSolid,
  },
  warning: {
    outline: ExclamationTriangleIcon,
    solid: ExclamationTriangleIconSolid,
  },
  info: {
    outline: InformationCircleIcon,
    solid: InformationCircleIconSolid,
  },
} as const;

/**
 * Get icon component for alert type
 * Supports both outline and solid variants
 */
const getAlertIcon = (type: AlertType, variant: 'outline' | 'solid' = 'outline') => {
  return alertIcons[type][variant];
};

// =============================================================================
// MAIN ALERT COMPONENT
// =============================================================================

/**
 * Main Alert component implementing React 19 compound pattern
 * Replaces Angular @Component decorator with forwardRef and context provider
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      type = ALERT_DEFAULTS.type,
      variant = ALERT_DEFAULTS.variant,
      size = ALERT_DEFAULTS.size,
      position = ALERT_DEFAULTS.position,
      title,
      description,
      dismissible = ALERT_DEFAULTS.dismissible,
      autoDismiss,
      onDismiss,
      onBeforeDismiss,
      showIcon = ALERT_DEFAULTS.showIcon,
      icon,
      actions,
      footer,
      priority = ALERT_DEFAULTS.priority,
      announce = ALERT_DEFAULTS.announce,
      announceText,
      'aria-live': ariaLive = ALERT_DEFAULTS['aria-live'],
      'aria-atomic': ariaAtomic = ALERT_DEFAULTS['aria-atomic'],
      alertId,
      fieldId,
      visible = true,
      animation = ALERT_DEFAULTS.animation,
      compact = ALERT_DEFAULTS.compact,
      fullWidth = ALERT_DEFAULTS.fullWidth,
      elevation = ALERT_DEFAULTS.elevation,
      className,
      style,
      children,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    // Generate unique alert ID if not provided
    const generatedId = useRef(`alert-${Math.random().toString(36).substr(2, 9)}`).current;
    const finalAlertId = alertId || generatedId;
    
    // Internal state management
    const [isVisible, setIsVisible] = useState(visible);
    const [isAnnounced, setIsAnnounced] = useState(false);
    
    // Auto-dismiss timer
    const autoDismissRef = useRef<NodeJS.Timeout>();
    
    // Handle auto-dismiss functionality
    useEffect(() => {
      if (autoDismiss && autoDismiss > 0 && isVisible) {
        autoDismissRef.current = setTimeout(() => {
          handleDismiss();
        }, autoDismiss);
        
        return () => {
          if (autoDismissRef.current) {
            clearTimeout(autoDismissRef.current);
          }
        };
      }
    }, [autoDismiss, isVisible]);
    
    // Handle visibility changes
    useEffect(() => {
      setIsVisible(visible);
    }, [visible]);
    
    // Screen reader announcements
    useEffect(() => {
      if (announce && isVisible && !isAnnounced) {
        const announcement = announceText || title || (typeof description === 'string' ? description : '');
        if (announcement) {
          // Create temporary announcement element
          const announcer = document.createElement('div');
          announcer.setAttribute('aria-live', ariaLive);
          announcer.setAttribute('aria-atomic', String(ariaAtomic));
          announcer.className = 'sr-only';
          announcer.textContent = `${type} alert: ${announcement}`;
          document.body.appendChild(announcer);
          
          // Remove after announcement
          setTimeout(() => {
            document.body.removeChild(announcer);
          }, 1000);
          
          setIsAnnounced(true);
        }
      }
    }, [announce, isVisible, isAnnounced, announceText, title, description, type, ariaLive, ariaAtomic]);
    
    /**
     * Handle alert dismissal with optional confirmation
     * Implements before-dismiss hook for validation
     */
    const handleDismiss = useCallback(async () => {
      try {
        // Check before-dismiss hook
        if (onBeforeDismiss) {
          const canDismiss = await onBeforeDismiss();
          if (!canDismiss) {
            return; // Prevent dismissal
          }
        }
        
        // Clear auto-dismiss timer
        if (autoDismissRef.current) {
          clearTimeout(autoDismissRef.current);
        }
        
        // Update visibility
        setIsVisible(false);
        
        // Call dismiss callback
        onDismiss?.();
      } catch (error) {
        console.error('Error during alert dismissal:', error);
      }
    }, [onBeforeDismiss, onDismiss]);
    
    /**
     * Handle keyboard interactions for accessibility
     * Supports Escape key for dismissal when dismissible
     */
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault();
        event.stopPropagation();
        handleDismiss();
      }
      
      // Call external key handler
      onKeyDown?.(event);
    }, [dismissible, handleDismiss, onKeyDown]);
    
    // Don't render if not visible
    if (!isVisible) {
      return null;
    }
    
    // Merge type-specific configurations
    const typeConfig = ALERT_TYPE_CONFIGS[type] || {};
    const mergedAriaLive = ariaLive || typeConfig['aria-live'] || ALERT_DEFAULTS['aria-live'];
    const mergedPriority = priority || typeConfig.priority || ALERT_DEFAULTS.priority;
    
    // Build alert classes
    const alertClasses = getAlertClasses({
      type,
      variant,
      size,
      position,
      compact,
      fullWidth,
      animation,
      className,
    });
    
    // Build context value for child components
    const contextValue: AlertContextValue = {
      type,
      variant,
      size,
      dismissible,
      onDismiss: handleDismiss,
      onBeforeDismiss,
      visible: isVisible,
      alertId: finalAlertId,
      compact,
      showIcon,
      announcement: announceText,
    };
    
    return (
      <AlertContext.Provider value={contextValue}>
        <div
          ref={ref}
          id={finalAlertId}
          role="alert"
          aria-live={mergedAriaLive}
          aria-atomic={ariaAtomic}
          aria-labelledby={title ? `${finalAlertId}-title` : undefined}
          aria-describedby={description ? `${finalAlertId}-description` : undefined}
          data-alert-type={type}
          data-alert-priority={mergedPriority}
          data-field-id={fieldId}
          className={alertClasses}
          style={style}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          tabIndex={dismissible ? 0 : -1}
          {...props}
        >
          {/* Icon */}
          {showIcon && (
            <Alert.Icon
              type={type}
              icon={icon}
              size={size}
              colored={variant !== 'outlined'}
            />
          )}
          
          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Main content */}
            {(title || description || children) && (
              <Alert.Content
                title={title}
                description={description}
                size={size}
                titleAs={priority === 'high' ? 'h2' : 'div'}
              >
                {children}
              </Alert.Content>
            )}
            
            {/* Footer content */}
            {footer && (
              <div className="mt-2">
                {footer}
              </div>
            )}
          </div>
          
          {/* Actions */}
          {actions && (
            <Alert.Actions
              actions={actions}
              size={size}
              layout="horizontal"
              alignment="end"
            />
          )}
          
          {/* Dismiss button */}
          {dismissible && (
            <Alert.Dismiss
              onDismiss={handleDismiss}
              size={size}
              aria-label={`Dismiss ${type} alert`}
            />
          )}
        </div>
      </AlertContext.Provider>
    );
  }
);

Alert.displayName = 'Alert';

// =============================================================================
// ALERT ICON COMPONENT
// =============================================================================

/**
 * Alert Icon component for displaying type-appropriate icons
 * Uses Heroicons per technology stack requirements
 */
const AlertIcon = forwardRef<HTMLSpanElement, AlertIconProps>(
  (
    {
      type,
      icon,
      size = 'md',
      colored = true,
      iconClassName,
      'aria-label': ariaLabel,
      decorative = false,
      className,
      ...props
    },
    ref
  ) => {
    const context = useAlertContext();
    
    // Use context type if not explicitly provided
    const iconType = type || context.type;
    const iconSize = size || context.size;
    
    // Icon size mapping
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };
    
    // Icon color mapping (when colored=true)
    const iconColors = {
      success: 'text-success-500',
      error: 'text-error-500',
      warning: 'text-warning-500',
      info: 'text-primary-500',
    };
    
    // Get the appropriate icon component
    const IconComponent = icon || getAlertIcon(iconType, context.variant === 'filled' ? 'solid' : 'outline');
    
    const iconClasses = cn(
      'flex-shrink-0',
      iconSizes[iconSize],
      colored && iconColors[iconType],
      iconClassName
    );
    
    return (
      <span
        ref={ref}
        className={cn('flex items-center', className)}
        aria-label={decorative ? undefined : ariaLabel || `${iconType} icon`}
        aria-hidden={decorative}
        {...props}
      >
        <IconComponent className={iconClasses} />
      </span>
    );
  }
);

AlertIcon.displayName = 'AlertIcon';

// =============================================================================
// ALERT CONTENT COMPONENT
// =============================================================================

/**
 * Alert Content component for title and description display
 * Supports rich content and proper semantic structure
 */
const AlertContent = forwardRef<HTMLDivElement, AlertContentProps>(
  (
    {
      title,
      description,
      size = 'md',
      truncate = false,
      maxLines,
      titleAs: TitleComponent = 'div',
      titleClassName,
      descriptionClassName,
      allowHTML = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const context = useAlertContext();
    
    // Use context size if not explicitly provided
    const contentSize = size || context.size;
    
    // Typography size mapping
    const titleSizes = {
      sm: 'text-sm font-medium',
      md: 'text-base font-medium',
      lg: 'text-lg font-semibold',
    };
    
    const descriptionSizes = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };
    
    // Truncation classes
    const truncationClasses = truncate
      ? cn(
          'overflow-hidden',
          maxLines ? `line-clamp-${maxLines}` : 'truncate'
        )
      : '';
    
    return (
      <div
        ref={ref}
        className={cn('flex-1 min-w-0', className)}
        {...props}
      >
        {/* Title */}
        {title && (
          <TitleComponent
            id={`${context.alertId}-title`}
            className={cn(
              titleSizes[contentSize],
              'leading-tight',
              truncationClasses,
              titleClassName
            )}
          >
            {allowHTML && typeof title === 'string' ? (
              <span dangerouslySetInnerHTML={{ __html: title }} />
            ) : (
              title
            )}
          </TitleComponent>
        )}
        
        {/* Description */}
        {description && (
          <div
            id={`${context.alertId}-description`}
            className={cn(
              descriptionSizes[contentSize],
              'leading-relaxed',
              title && 'mt-1',
              truncationClasses,
              descriptionClassName
            )}
          >
            {allowHTML && typeof description === 'string' ? (
              <span dangerouslySetInnerHTML={{ __html: description }} />
            ) : (
              description
            )}
          </div>
        )}
        
        {/* Children content */}
        {children && (
          <div className={cn((title || description) && 'mt-2')}>
            {children}
          </div>
        )}
      </div>
    );
  }
);

AlertContent.displayName = 'AlertContent';

// =============================================================================
// ALERT DISMISS COMPONENT
// =============================================================================

/**
 * Alert Dismiss component for close functionality
 * Integrates with existing Button component architecture
 */
const AlertDismiss = forwardRef<HTMLButtonElement, AlertDismissProps>(
  (
    {
      onDismiss,
      size = 'md',
      icon,
      'aria-label': ariaLabel = 'Dismiss alert',
      srOnly = false,
      buttonClassName,
      shortcut,
      requireConfirmation = false,
      confirmationText = 'Are you sure you want to dismiss this alert?',
      className,
      ...props
    },
    ref
  ) => {
    const context = useAlertContext();
    
    // Use context size if not explicitly provided
    const buttonSize = size || context.size;
    
    // Button size mapping for icon buttons
    const dismissSizes = {
      sm: 'h-6 w-6',
      md: 'h-8 w-8',
      lg: 'h-10 w-10',
    };
    
    // Icon size mapping
    const iconSizes = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };
    
    /**
     * Handle dismiss click with optional confirmation
     */
    const handleDismiss = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      
      // Show confirmation if required
      if (requireConfirmation) {
        const confirmed = window.confirm(confirmationText);
        if (!confirmed) {
          return;
        }
      }
      
      // Call dismiss handler
      await onDismiss();
    }, [onDismiss, requireConfirmation, confirmationText]);
    
    /**
     * Handle keyboard shortcuts
     */
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (shortcut && event.key === shortcut) {
        event.preventDefault();
        handleDismiss(event as any);
      }
    }, [shortcut, handleDismiss]);
    
    // Default dismiss icon
    const DismissIcon = icon || XMarkIcon;
    
    return (
      <div className={cn('flex items-start', className)}>
        <Button
          ref={ref}
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          title={shortcut ? `${ariaLabel} (${shortcut})` : ariaLabel}
          className={cn(
            'flex-shrink-0 p-1 text-current hover:bg-black/5 dark:hover:bg-white/5',
            'focus-visible:ring-current focus-visible:ring-offset-0',
            dismissSizes[buttonSize],
            srOnly && 'sr-only',
            buttonClassName
          )}
          {...props}
        >
          <DismissIcon className={iconSizes[buttonSize]} />
        </Button>
      </div>
    );
  }
);

AlertDismiss.displayName = 'AlertDismiss';

// =============================================================================
// ALERT ACTIONS COMPONENT
// =============================================================================

/**
 * Alert Actions component for action buttons
 * Provides flexible layout and responsive behavior
 */
const AlertActions = forwardRef<HTMLDivElement, AlertActionsProps>(
  (
    {
      actions,
      layout = 'horizontal',
      alignment = 'end',
      size = 'md',
      spacing = 'normal',
      stackOnMobile = true,
      actionsClassName,
      className,
      ...props
    },
    ref
  ) => {
    const context = useAlertContext();
    
    // Use context size if not explicitly provided
    const actionSize = size || context.size;
    
    // Layout classes
    const layoutClasses = {
      horizontal: 'flex flex-row',
      vertical: 'flex flex-col',
    };
    
    // Alignment classes
    const alignmentClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };
    
    // Spacing classes
    const spacingClasses = {
      compact: layout === 'horizontal' ? 'gap-1' : 'gap-1',
      normal: layout === 'horizontal' ? 'gap-2' : 'gap-2',
      relaxed: layout === 'horizontal' ? 'gap-3' : 'gap-3',
    };
    
    // Responsive stacking classes
    const responsiveClasses = stackOnMobile 
      ? 'flex-col sm:flex-row gap-2 sm:gap-2'
      : '';
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          stackOnMobile ? responsiveClasses : layoutClasses[layout],
          !stackOnMobile && alignmentClasses[alignment],
          !stackOnMobile && spacingClasses[spacing],
          className
        )}
        {...props}
      >
        <div className={cn('flex gap-2', actionsClassName)}>
          {actions}
        </div>
      </div>
    );
  }
);

AlertActions.displayName = 'AlertActions';

// =============================================================================
// COMPOUND COMPONENT ASSIGNMENT
// =============================================================================

/**
 * Assign subcomponents to main Alert component for compound pattern
 * Enables usage like Alert.Icon, Alert.Content, etc.
 */
Alert.Icon = AlertIcon;
Alert.Content = AlertContent;
Alert.Dismiss = AlertDismiss;
Alert.Actions = AlertActions;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create alert with default configuration
 * Utility function for common alert patterns
 */
export const createAlert = (
  type: AlertType,
  message: string | ReactNode,
  options: Partial<AlertProps> = {}
): AlertProps => {
  const typeConfig = ALERT_TYPE_CONFIGS[type] || {};
  
  return {
    type,
    description: message,
    ...typeConfig,
    ...options,
  };
};

/**
 * Alert helper functions for common use cases
 * Replaces Angular service-based alert creation
 */
export const AlertHelpers = {
  success: (message: string | ReactNode, options?: Partial<AlertProps>) =>
    createAlert('success', message, options),
  
  error: (message: string | ReactNode, options?: Partial<AlertProps>) =>
    createAlert('error', message, { dismissible: true, ...options }),
  
  warning: (message: string | ReactNode, options?: Partial<AlertProps>) =>
    createAlert('warning', message, options),
  
  info: (message: string | ReactNode, options?: Partial<AlertProps>) =>
    createAlert('info', message, options),
  
  /**
   * Create validation error alert for form fields
   * Replaces Angular df-error functionality
   */
  validationError: (fieldName: string, message: string, fieldId?: string) =>
    createAlert('error', message, {
      title: `${fieldName} Error`,
      fieldId,
      dismissible: true,
      priority: 'high',
      announce: true,
      variant: 'soft',
      size: 'sm',
    }),
  
  /**
   * Create banner alert for page-level notifications
   * Replaces Angular df-alert banner functionality
   */
  banner: (type: AlertType, message: string | ReactNode, options?: Partial<AlertProps>) =>
    createAlert(type, message, {
      variant: 'banner',
      fullWidth: true,
      position: 'sticky',
      ...options,
    }),
};

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type { 
  AlertProps,
  AlertIconProps,
  AlertContentProps,
  AlertDismissProps,
  AlertActionsProps,
  AlertType,
  AlertVariant,
  AlertSize,
};

export {
  ALERT_DEFAULTS,
  ALERT_TYPE_CONFIGS,
  alertVariants,
  getAlertClasses,
  getAlertIcon,
  useAlertContext,
};

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default Alert;