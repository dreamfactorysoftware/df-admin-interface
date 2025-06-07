/**
 * Email Template Alert and Notification Components
 * 
 * Comprehensive alert and notification components for email template operations providing
 * success, error, warning, and info messages. Implements toast notifications, inline alerts,
 * and confirmation dialogs with proper accessibility compliance and auto-dismiss functionality.
 * 
 * Features:
 * - Toast notifications for email template CRUD operation feedback
 * - Inline alerts for form validation errors and field-specific messaging
 * - Confirmation dialogs for destructive operations with proper accessibility
 * - Auto-dismiss functionality with configurable timeout and user control
 * - WCAG 2.1 AA compliance with proper color contrast and keyboard navigation
 * - React 19 concurrent features support with optimistic updates
 * - TypeScript 5.8+ enhanced type safety and inference
 * - Tailwind CSS 4.1+ utility-first styling with design system integration
 * 
 * @fileoverview Email template alert components for React application
 * @version 1.0.0
 * @see Technical Specification Section 0 - SUMMARY OF CHANGES
 * @see Technical Specification Section 7.1 - CORE UI TECHNOLOGIES
 * @see Technical Specification Section 4.2 - ERROR HANDLING AND VALIDATION
 * @see Technical Specification Section 5.4 - CROSS-CUTTING CONCERNS
 */

'use client';

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useNotifications, useFormNotifications } from '@/hooks/use-notifications';
import { Alert } from '@/components/ui/alert';
import { Dialog } from '@/components/ui/dialog';
import type { 
  NotificationType, 
  NotificationConfig,
  NotificationAction,
  Notification
} from '@/types/notification';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/**
 * Email template operation types for notification categorization
 * Maps to specific CRUD operations and validation scenarios
 */
export type EmailTemplateOperation = 
  | 'create'
  | 'update' 
  | 'delete'
  | 'duplicate'
  | 'validate'
  | 'save'
  | 'preview'
  | 'reset'
  | 'import'
  | 'export';

/**
 * Alert severity levels with email template context
 * Extends base notification types with operation-specific semantics
 */
export type EmailTemplateAlertType = NotificationType;

/**
 * Configuration for email template notification timeouts
 * Optimized for email template workflow patterns
 */
const EMAIL_TEMPLATE_DURATIONS = {
  success: 4000,      // Success operations - quick acknowledgment
  error: 8000,        // Error states - longer for reading
  warning: 6000,      // Warnings - moderate duration
  info: 5000,         // Information - standard duration
  validation: 10000,  // Validation errors - longer for correction
  destructive: -1,    // Destructive confirmations - persistent until action
} as const;

/**
 * WCAG 2.1 AA compliant color mappings for different alert types
 * Ensures proper contrast ratios for accessibility compliance
 */
const ALERT_STYLING = {
  success: {
    containerClass: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    iconClass: 'text-green-500 dark:text-green-400',
    buttonClass: 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200',
    ariaRole: 'status' as const,
    ariaLive: 'polite' as const,
  },
  error: {
    containerClass: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    iconClass: 'text-red-500 dark:text-red-400',
    buttonClass: 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200',
    ariaRole: 'alert' as const,
    ariaLive: 'assertive' as const,
  },
  warning: {
    containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    iconClass: 'text-yellow-500 dark:text-yellow-400',
    buttonClass: 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200',
    ariaRole: 'alert' as const,
    ariaLive: 'polite' as const,
  },
  info: {
    containerClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    iconClass: 'text-blue-500 dark:text-blue-400',
    buttonClass: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
    ariaRole: 'status' as const,
    ariaLive: 'polite' as const,
  },
} as const;

/**
 * Icons for different alert types using Heroicons
 * Provides visual context for notification content
 */
const ALERT_ICONS = {
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.36a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
    </svg>
  ),
} as const;

// =============================================================================
// INTERFACE DEFINITIONS
// =============================================================================

/**
 * Configuration interface for email template notifications
 * Extends base notification config with email template specific options
 */
export interface EmailTemplateNotificationConfig extends Partial<NotificationConfig> {
  /** Email template operation that triggered the notification */
  operation?: EmailTemplateOperation;
  
  /** Template name for contextual messaging */
  templateName?: string;
  
  /** Field name for validation errors */
  fieldName?: string;
  
  /** Whether to include retry action for failed operations */
  includeRetry?: boolean;
  
  /** Custom retry callback function */
  onRetry?: () => void | Promise<void>;
  
  /** Whether to persist notification across navigation */
  persistAcrossNavigation?: boolean;
}

/**
 * Props interface for EmailTemplateToastProvider component
 */
export interface EmailTemplateToastProviderProps {
  children: React.ReactNode;
  /** Override default toast configuration */
  config?: {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    maxToasts?: number;
    defaultDuration?: number;
  };
}

/**
 * Props interface for EmailTemplateInlineAlert component
 */
export interface EmailTemplateInlineAlertProps {
  /** Alert type */
  type: EmailTemplateAlertType;
  
  /** Alert title */
  title?: string;
  
  /** Alert message */
  message: string;
  
  /** Whether alert is dismissible */
  dismissible?: boolean;
  
  /** Whether alert is visible */
  visible?: boolean;
  
  /** Callback when alert is dismissed */
  onDismiss?: () => void;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Field name for validation context */
  fieldName?: string;
  
  /** Whether to show field-specific styling */
  isFieldError?: boolean;
  
  /** Custom actions to display */
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'destructive';
  }[];
}

/**
 * Props interface for EmailTemplateConfirmDialog component
 */
export interface EmailTemplateConfirmDialogProps {
  /** Whether dialog is open */
  open: boolean;
  
  /** Dialog title */
  title: string;
  
  /** Dialog description/message */
  message: string;
  
  /** Type of destructive operation */
  operationType: 'delete' | 'reset' | 'discard' | 'replace';
  
  /** Template name for context */
  templateName?: string;
  
  /** Callback when confirmed */
  onConfirm: () => void | Promise<void>;
  
  /** Callback when cancelled */
  onCancel: () => void;
  
  /** Whether confirm action is loading */
  isLoading?: boolean;
  
  /** Custom confirm button text */
  confirmText?: string;
  
  /** Custom cancel button text */
  cancelText?: string;
  
  /** Additional warning message */
  warningMessage?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate contextual notification message based on operation and result
 * Provides user-friendly messaging for email template operations
 */
const generateNotificationMessage = (
  operation: EmailTemplateOperation,
  type: EmailTemplateAlertType,
  templateName?: string,
  customMessage?: string
): string => {
  if (customMessage) return customMessage;
  
  const template = templateName ? ` "${templateName}"` : '';
  
  const messages: Record<EmailTemplateOperation, Record<EmailTemplateAlertType, string>> = {
    create: {
      success: `Email template${template} created successfully`,
      error: `Failed to create email template${template}`,
      warning: `Email template${template} created with warnings`,
      info: `Creating email template${template}...`,
    },
    update: {
      success: `Email template${template} updated successfully`,
      error: `Failed to update email template${template}`,
      warning: `Email template${template} updated with warnings`,
      info: `Updating email template${template}...`,
    },
    delete: {
      success: `Email template${template} deleted successfully`,
      error: `Failed to delete email template${template}`,
      warning: `Email template${template} deletion may affect other components`,
      info: `Deleting email template${template}...`,
    },
    duplicate: {
      success: `Email template${template} duplicated successfully`,
      error: `Failed to duplicate email template${template}`,
      warning: `Email template${template} duplicated with modified name`,
      info: `Duplicating email template${template}...`,
    },
    validate: {
      success: `Email template${template} validation passed`,
      error: `Email template${template} validation failed`,
      warning: `Email template${template} has validation warnings`,
      info: `Validating email template${template}...`,
    },
    save: {
      success: `Email template${template} saved successfully`,
      error: `Failed to save email template${template}`,
      warning: `Email template${template} saved with warnings`,
      info: `Saving email template${template}...`,
    },
    preview: {
      success: `Email template${template} preview generated`,
      error: `Failed to generate preview for email template${template}`,
      warning: `Email template${template} preview may not display correctly`,
      info: `Generating preview for email template${template}...`,
    },
    reset: {
      success: `Email template${template} reset to default values`,
      error: `Failed to reset email template${template}`,
      warning: `Email template${template} reset will lose current changes`,
      info: `Resetting email template${template}...`,
    },
    import: {
      success: `Email template${template} imported successfully`,
      error: `Failed to import email template${template}`,
      warning: `Email template${template} imported with compatibility issues`,
      info: `Importing email template${template}...`,
    },
    export: {
      success: `Email template${template} exported successfully`,
      error: `Failed to export email template${template}`,
      warning: `Email template${template} export may be incomplete`,
      info: `Exporting email template${template}...`,
    },
  };
  
  return messages[operation]?.[type] || `Operation ${operation} ${type}`;
};

/**
 * Generate accessible label for notification based on context
 * Ensures proper screen reader announcements
 */
const generateAccessibleLabel = (
  type: EmailTemplateAlertType,
  operation?: EmailTemplateOperation,
  templateName?: string
): string => {
  const typeLabels = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
  };
  
  const operationContext = operation ? ` for ${operation} operation` : '';
  const templateContext = templateName ? ` on template ${templateName}` : '';
  
  return `${typeLabels[type]} notification${operationContext}${templateContext}`;
};

// =============================================================================
// TOAST NOTIFICATION PROVIDER
// =============================================================================

/**
 * EmailTemplateToastProvider Component
 * 
 * Provides toast notification functionality specifically optimized for email template
 * operations. Integrates with the global notification system while providing
 * email template specific configuration and messaging.
 */
export const EmailTemplateToastProvider: React.FC<EmailTemplateToastProviderProps> = ({
  children,
  config = {},
}) => {
  const notifications = useNotifications({
    maxNotifications: config.maxToasts || 3,
    defaultPosition: config.position || 'bottom-right',
    defaultDuration: config.defaultDuration || EMAIL_TEMPLATE_DURATIONS.success,
    groupSimilar: true,
    animationDuration: 300,
  });

  /**
   * Show email template specific notification
   * Provides enhanced messaging and configuration for email template operations
   */
  const showNotification = useCallback((notificationConfig: EmailTemplateNotificationConfig) => {
    const message = generateNotificationMessage(
      notificationConfig.operation || 'save',
      notificationConfig.type || 'info',
      notificationConfig.templateName,
      notificationConfig.message
    );

    const accessibleLabel = generateAccessibleLabel(
      notificationConfig.type || 'info',
      notificationConfig.operation,
      notificationConfig.templateName
    );

    const actions: NotificationAction[] = [];
    
    // Add retry action for failed operations
    if (notificationConfig.includeRetry && notificationConfig.onRetry) {
      actions.push({
        label: 'Retry',
        onClick: notificationConfig.onRetry,
        variant: 'primary',
        dismissOnClick: true,
      });
    }

    const duration = notificationConfig.duration || 
      EMAIL_TEMPLATE_DURATIONS[notificationConfig.type || 'info'] ||
      EMAIL_TEMPLATE_DURATIONS.info;

    return notifications.notify({
      type: notificationConfig.type || 'info',
      title: notificationConfig.title,
      message,
      duration,
      dismissible: notificationConfig.dismissible !== false,
      announce: true,
      actions: actions.length > 0 ? actions : undefined,
      metadata: {
        operation: notificationConfig.operation,
        templateName: notificationConfig.templateName,
        fieldName: notificationConfig.fieldName,
        accessibleLabel,
        ...notificationConfig.metadata,
      },
      ...notificationConfig,
    });
  }, [notifications]);

  /**
   * Convenience methods for email template operations
   */
  const emailTemplateNotifications = useMemo(() => ({
    ...notifications,
    
    // Email template operation notifications
    showOperationSuccess: (operation: EmailTemplateOperation, templateName?: string, customMessage?: string) => 
      showNotification({
        type: 'success',
        operation,
        templateName,
        message: customMessage,
        duration: EMAIL_TEMPLATE_DURATIONS.success,
      }),
    
    showOperationError: (operation: EmailTemplateOperation, templateName?: string, customMessage?: string, onRetry?: () => void) => 
      showNotification({
        type: 'error',
        operation,
        templateName,
        message: customMessage,
        duration: EMAIL_TEMPLATE_DURATIONS.error,
        includeRetry: !!onRetry,
        onRetry,
      }),
    
    showOperationWarning: (operation: EmailTemplateOperation, templateName?: string, customMessage?: string) => 
      showNotification({
        type: 'warning',
        operation,
        templateName,
        message: customMessage,
        duration: EMAIL_TEMPLATE_DURATIONS.warning,
      }),
    
    showOperationInfo: (operation: EmailTemplateOperation, templateName?: string, customMessage?: string) => 
      showNotification({
        type: 'info',
        operation,
        templateName,
        message: customMessage,
        duration: EMAIL_TEMPLATE_DURATIONS.info,
      }),
    
    // Validation specific notifications
    showValidationError: (fieldName: string, message: string, templateName?: string) => 
      showNotification({
        type: 'error',
        operation: 'validate',
        templateName,
        fieldName,
        message: `${fieldName}: ${message}`,
        duration: EMAIL_TEMPLATE_DURATIONS.validation,
      }),
    
    // Quick success notification for common operations
    templateCreated: (templateName: string) => 
      showNotification({
        type: 'success',
        operation: 'create',
        templateName,
        duration: EMAIL_TEMPLATE_DURATIONS.success,
      }),
    
    templateUpdated: (templateName: string) => 
      showNotification({
        type: 'success',
        operation: 'update',
        templateName,
        duration: EMAIL_TEMPLATE_DURATIONS.success,
      }),
    
    templateDeleted: (templateName: string) => 
      showNotification({
        type: 'success',
        operation: 'delete',
        templateName,
        duration: EMAIL_TEMPLATE_DURATIONS.success,
      }),
  }), [notifications, showNotification]);

  // Create context value
  const contextValue = React.useMemo(() => emailTemplateNotifications, [emailTemplateNotifications]);

  return (
    <EmailTemplateNotificationContext.Provider value={contextValue}>
      {children}
    </EmailTemplateNotificationContext.Provider>
  );
};

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * React context for email template notifications
 * Provides notification methods throughout the email template component tree
 */
const EmailTemplateNotificationContext = React.createContext<ReturnType<typeof useNotifications> | null>(null);

/**
 * Hook to use email template notifications
 * Provides access to email template specific notification methods
 */
export const useEmailTemplateNotifications = () => {
  const context = React.useContext(EmailTemplateNotificationContext);
  if (!context) {
    throw new Error('useEmailTemplateNotifications must be used within EmailTemplateToastProvider');
  }
  return context;
};

// =============================================================================
// INLINE ALERT COMPONENT
// =============================================================================

/**
 * EmailTemplateInlineAlert Component
 * 
 * Displays inline alerts for form validation errors and operational feedback.
 * Optimized for email template forms with proper accessibility and visual hierarchy.
 */
export const EmailTemplateInlineAlert: React.FC<EmailTemplateInlineAlertProps> = ({
  type,
  title,
  message,
  dismissible = true,
  visible = true,
  onDismiss,
  className = '',
  fieldName,
  isFieldError = false,
  actions = [],
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const alertRef = useRef<HTMLDivElement>(null);

  // Update visibility when prop changes
  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  // Handle dismiss action
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible && type === 'error' && alertRef.current) {
      // Focus error alerts for immediate attention
      alertRef.current.focus();
    }
  }, [isVisible, type]);

  // Don't render if not visible
  if (!isVisible) return null;

  const styling = ALERT_STYLING[type];
  const icon = ALERT_ICONS[type];
  
  // Generate accessible label
  const accessibleLabel = generateAccessibleLabel(type, undefined, fieldName);
  
  // Combine CSS classes
  const containerClasses = [
    'relative p-4 border rounded-lg transition-all duration-200 ease-in-out',
    styling.containerClass,
    isFieldError ? 'border-l-4' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={alertRef}
      className={containerClasses}
      role={styling.ariaRole}
      aria-live={styling.ariaLive}
      aria-label={accessibleLabel}
      tabIndex={type === 'error' ? 0 : -1}
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styling.iconClass}`}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          
          <div className="text-sm">
            {message}
          </div>
          
          {/* Actions */}
          {actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={action.onClick}
                  className={`
                    inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${action.variant === 'primary' ? `${styling.buttonClass} bg-current/10 hover:bg-current/20` :
                      action.variant === 'destructive' ? 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100' :
                      `${styling.buttonClass} hover:underline`}
                  `}
                  aria-label={`${action.label} for ${accessibleLabel}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Dismiss button */}
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className={`
                  inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  transition-colors duration-200 ${styling.buttonClass}
                `}
                aria-label={`Dismiss ${accessibleLabel}`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// CONFIRMATION DIALOG COMPONENT
// =============================================================================

/**
 * EmailTemplateConfirmDialog Component
 * 
 * Displays confirmation dialogs for destructive email template operations.
 * Provides clear context and proper accessibility for critical user decisions.
 */
export const EmailTemplateConfirmDialog: React.FC<EmailTemplateConfirmDialogProps> = ({
  open,
  title,
  message,
  operationType,
  templateName,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText,
  cancelText = 'Cancel',
  warningMessage,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Default confirm text based on operation type
  const defaultConfirmText = {
    delete: 'Delete',
    reset: 'Reset',
    discard: 'Discard',
    replace: 'Replace',
  }[operationType];

  const finalConfirmText = confirmText || defaultConfirmText;

  // Handle confirmation with loading state
  const handleConfirm = useCallback(async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is managed by the parent component
      console.error('Confirmation action failed:', error);
    }
  }, [onConfirm]);

  // Keyboard handling for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }, [onCancel]);

  // Focus management
  useEffect(() => {
    if (open && confirmRef.current) {
      // Focus the confirm button when dialog opens
      const timer = setTimeout(() => {
        confirmRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Icon for destructive operations
  const warningIcon = (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
      <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    </div>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      className="relative z-50"
    >
      {/* Background overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
      
      {/* Dialog container */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div 
            className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
            onKeyDown={handleKeyDown}
          >
            {/* Content */}
            <div className="sm:flex sm:items-start">
              {/* Warning icon */}
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              
              {/* Text content */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100"
                  id="modal-title"
                >
                  {title}
                </h3>
                
                <div className="mt-2">
                  <p 
                    className="text-sm text-gray-500 dark:text-gray-400"
                    id="modal-description"
                  >
                    {message}
                  </p>
                  
                  {templateName && (
                    <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Template: {templateName}
                    </p>
                  )}
                  
                  {warningMessage && (
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Warning:</strong> {warningMessage}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              {/* Confirm button */}
              <button
                ref={confirmRef}
                type="button"
                disabled={isLoading}
                onClick={handleConfirm}
                className={`
                  inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                  transition-colors duration-200
                  ${isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800'
                  }
                `}
                aria-describedby="modal-description"
              >
                {isLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Processing...' : finalConfirmText}
              </button>
              
              {/* Cancel button */}
              <button
                type="button"
                disabled={isLoading}
                onClick={onCancel}
                className={`
                  mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm 
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm
                  transition-colors duration-200
                  ${isLoading 
                    ? 'cursor-not-allowed opacity-50' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

// =============================================================================
// COMPOSITE ALERT MANAGER
// =============================================================================

/**
 * EmailTemplateAlertManager Hook
 * 
 * Provides a unified interface for managing all types of email template alerts
 * including toasts, inline alerts, and confirmation dialogs.
 */
export const useEmailTemplateAlertManager = () => {
  const [inlineAlerts, setInlineAlerts] = useState<Map<string, EmailTemplateInlineAlertProps>>(new Map());
  const [confirmDialog, setConfirmDialog] = useState<EmailTemplateConfirmDialogProps | null>(null);
  
  // Get toast notifications from context
  const toastNotifications = useEmailTemplateNotifications();
  
  /**
   * Show inline alert with auto-cleanup
   */
  const showInlineAlert = useCallback((id: string, alertProps: Omit<EmailTemplateInlineAlertProps, 'visible' | 'onDismiss'>) => {
    setInlineAlerts(prev => new Map(prev.set(id, {
      ...alertProps,
      visible: true,
      onDismiss: () => {
        setInlineAlerts(current => {
          const updated = new Map(current);
          updated.delete(id);
          return updated;
        });
      },
    })));
    
    // Auto-dismiss after configured timeout
    if (alertProps.type !== 'error') {
      const timeout = EMAIL_TEMPLATE_DURATIONS[alertProps.type] || EMAIL_TEMPLATE_DURATIONS.info;
      if (timeout > 0) {
        setTimeout(() => {
          setInlineAlerts(current => {
            const updated = new Map(current);
            updated.delete(id);
            return updated;
          });
        }, timeout);
      }
    }
  }, []);
  
  /**
   * Hide inline alert
   */
  const hideInlineAlert = useCallback((id: string) => {
    setInlineAlerts(prev => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  }, []);
  
  /**
   * Show confirmation dialog
   */
  const showConfirmDialog = useCallback((dialogProps: Omit<EmailTemplateConfirmDialogProps, 'open' | 'onCancel'>) => {
    setConfirmDialog({
      ...dialogProps,
      open: true,
      onCancel: () => setConfirmDialog(null),
    });
  }, []);
  
  /**
   * Hide confirmation dialog
   */
  const hideConfirmDialog = useCallback(() => {
    setConfirmDialog(null);
  }, []);
  
  /**
   * Clear all alerts
   */
  const clearAllAlerts = useCallback(() => {
    setInlineAlerts(new Map());
    setConfirmDialog(null);
    toastNotifications.dismissAll();
  }, [toastNotifications]);
  
  return {
    // Toast notifications
    toasts: toastNotifications,
    
    // Inline alerts
    inlineAlerts: Array.from(inlineAlerts.entries()).map(([id, props]) => ({ id, ...props })),
    showInlineAlert,
    hideInlineAlert,
    
    // Confirmation dialogs
    confirmDialog,
    showConfirmDialog,
    hideConfirmDialog,
    
    // Utility
    clearAllAlerts,
  };
};

// =============================================================================
// EXPORT STATEMENTS
// =============================================================================

export default {
  EmailTemplateToastProvider,
  EmailTemplateInlineAlert,
  EmailTemplateConfirmDialog,
  useEmailTemplateNotifications,
  useEmailTemplateAlertManager,
};

export type {
  EmailTemplateOperation,
  EmailTemplateAlertType,
  EmailTemplateNotificationConfig,
  EmailTemplateToastProviderProps,
  EmailTemplateInlineAlertProps,
  EmailTemplateConfirmDialogProps,
};