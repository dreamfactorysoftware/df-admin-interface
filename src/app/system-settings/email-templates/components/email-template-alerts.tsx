'use client'

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'
import { 
  XMarkIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from '@heroicons/react/24/outline'
import { XMarkIcon as XMarkIconSolid } from '@heroicons/react/24/solid'

// Types for alert and toast system
export type AlertType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

export interface AlertProps {
  type: AlertType
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
  children?: React.ReactNode
  'aria-label'?: string
  role?: 'alert' | 'status' | 'alertdialog'
}

export interface ToastProps extends Omit<AlertProps, 'className'> {
  id: string
  duration?: number
  position?: ToastPosition
  persistent?: boolean
}

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

// Toast context for managing toast notifications
interface ToastContextValue {
  showToast: (toast: Omit<ToastProps, 'id'>) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
  toasts: ToastProps[]
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Toast provider component
export const ToastProvider: React.FC<{ children: React.ReactNode; position?: ToastPosition }> = ({ 
  children, 
  position = 'top-right' 
}) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const toastIdCounter = useRef(0)

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = `toast-${++toastIdCounter.current}`
    const newToast: ToastProps = {
      ...toast,
      id,
      position: toast.position || position,
      duration: toast.duration ?? 5000,
      persistent: toast.persistent ?? false
    }

    setToasts(prev => [...prev, newToast])

    // Auto-dismiss unless persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id)
      }, newToast.duration)
    }

    return id
  }, [position])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts, toasts }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  )
}

// Custom hook for using toast notifications
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Icon mapping for different alert types
const alertIcons = {
  success: CheckCircleIcon,
  error: ExclamationCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon
}

// Style mappings for different alert types using Tailwind CSS
const alertStyles = {
  success: {
    container: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-700 dark:text-success-100',
    icon: 'text-success-600 dark:text-success-400',
    title: 'text-success-800 dark:text-success-100',
    message: 'text-success-700 dark:text-success-200'
  },
  error: {
    container: 'bg-error-50 border-error-200 text-error-800 dark:bg-error-900/20 dark:border-error-700 dark:text-error-100',
    icon: 'text-error-600 dark:text-error-400',
    title: 'text-error-800 dark:text-error-100',
    message: 'text-error-700 dark:text-error-200'
  },
  warning: {
    container: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-700 dark:text-warning-100',
    icon: 'text-warning-600 dark:text-warning-400',
    title: 'text-warning-800 dark:text-warning-100',
    message: 'text-warning-700 dark:text-warning-200'
  },
  info: {
    container: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-100',
    icon: 'text-primary-600 dark:text-primary-400',
    title: 'text-primary-800 dark:text-primary-100',
    message: 'text-primary-700 dark:text-primary-200'
  }
}

// Base Alert component with accessibility features
export const Alert: React.FC<AlertProps> = React.forwardRef<HTMLDivElement, AlertProps>(({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className = '',
  children,
  'aria-label': ariaLabel,
  role = 'alert',
  ...props
}, ref) => {
  const IconComponent = alertIcons[type]
  const styles = alertStyles[type]
  
  // Handle keyboard navigation for dismiss button
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && dismissible && onDismiss) {
      onDismiss()
    }
  }, [dismissible, onDismiss])

  return (
    <div
      ref={ref}
      className={`
        flex items-start p-4 border rounded-lg transition-all duration-300 ease-in-out
        ${styles.container}
        ${className}
      `}
      role={role}
      aria-label={ariaLabel || `${type} alert: ${message}`}
      onKeyDown={handleKeyDown}
      tabIndex={dismissible ? 0 : -1}
      {...props}
    >
      {/* Alert Icon */}
      <div className="flex-shrink-0 mr-3">
        <IconComponent 
          className={`h-5 w-5 ${styles.icon}`} 
          aria-hidden="true"
        />
      </div>

      {/* Alert Content */}
      <div className="flex-grow min-w-0">
        {title && (
          <h3 className={`text-sm font-semibold mb-1 ${styles.title}`}>
            {title}
          </h3>
        )}
        <div className={`text-sm ${styles.message}`}>
          {message}
        </div>
        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <button
          type="button"
          className={`
            flex-shrink-0 ml-3 p-1 rounded-md transition-colors duration-200
            ${styles.icon} hover:bg-black/10 dark:hover:bg-white/10
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          `}
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          <XMarkIconSolid className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  )
})

Alert.displayName = 'Alert'

// Toast container for positioning and managing toasts
const ToastContainer: React.FC<{ 
  toasts: ToastProps[]
  onDismiss: (id: string) => void 
}> = ({ toasts, onDismiss }) => {
  // Group toasts by position
  const toastsByPosition = toasts.reduce((acc, toast) => {
    const pos = toast.position || 'top-right'
    if (!acc[pos]) acc[pos] = []
    acc[pos].push(toast)
    return acc
  }, {} as Record<ToastPosition, ToastProps[]>)

  const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <>
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-50 pointer-events-none ${positionClasses[position as ToastPosition]}`}
          aria-live="polite"
          aria-label="Toast notifications"
        >
          <div className="flex flex-col space-y-2 max-w-sm">
            {positionToasts.map((toast) => (
              <Toast
                key={toast.id}
                {...toast}
                onDismiss={() => onDismiss(toast.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

// Individual toast component
const Toast: React.FC<ToastProps & { onDismiss: () => void }> = ({
  type,
  title,
  message,
  onDismiss,
  persistent,
  children,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Animation timing
  useEffect(() => {
    // Entry animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = useCallback(() => {
    setIsExiting(true)
    // Wait for exit animation before removing
    setTimeout(() => {
      onDismiss()
    }, 300)
  }, [onDismiss])

  return (
    <div
      className={`
        pointer-events-auto transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
      `}
      role="status"
      aria-live="polite"
    >
      <Alert
        type={type}
        title={title}
        message={message}
        dismissible={true}
        onDismiss={handleDismiss}
        className="shadow-lg border-2"
        {...props}
      >
        {children}
      </Alert>
    </div>
  )
}

// Confirmation dialog component with accessibility
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel,
  loading = false,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby
}) => {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default for safety
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      } else if (event.key === 'Tab') {
        // Trap focus within dialog
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
          
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault()
              lastElement.focus()
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault()
              firstElement.focus()
            }
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Handle backdrop click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === overlayRef.current) {
      onCancel()
    }
  }, [onCancel])

  if (!isOpen) return null

  const typeStyles = {
    danger: {
      icon: ExclamationCircleIcon,
      iconColor: 'text-error-600',
      confirmButton: 'bg-error-600 hover:bg-error-700 focus:ring-error-500'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      iconColor: 'text-warning-600',
      confirmButton: 'bg-warning-600 hover:bg-warning-700 focus:ring-warning-500'
    },
    info: {
      icon: InformationCircleIcon,
      iconColor: 'text-primary-600',
      confirmButton: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
    }
  }

  const currentStyle = typeStyles[type]
  const IconComponent = currentStyle.icon

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="alertdialog"
      aria-labelledby={ariaLabelledby || 'confirm-dialog-title'}
      aria-describedby={ariaDescribedby || 'confirm-dialog-description'}
      onClick={handleOverlayClick}
    >
      <div
        ref={dialogRef}
        className="
          relative w-full max-w-md mx-auto bg-white dark:bg-gray-800 
          rounded-lg shadow-xl border border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-out
          animate-fade-in
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div className="flex items-start p-6 pb-4">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4`}>
            <IconComponent className={`w-6 h-6 ${currentStyle.iconColor}`} aria-hidden="true" />
          </div>
          <div className="flex-grow">
            <h3
              id={ariaLabelledby || 'confirm-dialog-title'}
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h3>
            <p
              id={ariaDescribedby || 'confirm-dialog-description'}
              className="mt-2 text-sm text-gray-600 dark:text-gray-300"
            >
              {message}
            </p>
          </div>
        </div>

        {/* Dialog Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 p-6 pt-0">
          <button
            ref={cancelButtonRef}
            type="button"
            className="
              w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
              bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
              rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200
            "
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`
              w-full sm:w-auto px-4 py-2 text-sm font-medium text-white
              rounded-md shadow-sm transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${currentStyle.confirmButton}
              ${loading ? 'cursor-wait' : ''}
            `}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Email template specific alert components
export const EmailTemplateToast = {
  success: (message: string, options?: Partial<ToastProps>) => ({
    type: 'success' as const,
    title: 'Email Template Success',
    message,
    ...options
  }),
  
  error: (message: string, options?: Partial<ToastProps>) => ({
    type: 'error' as const,
    title: 'Email Template Error',
    message,
    ...options
  }),
  
  warning: (message: string, options?: Partial<ToastProps>) => ({
    type: 'warning' as const,
    title: 'Email Template Warning',
    message,
    ...options
  }),
  
  info: (message: string, options?: Partial<ToastProps>) => ({
    type: 'info' as const,
    title: 'Email Template Info',
    message,
    ...options
  })
}

// Form validation alert component
export const FormValidationAlert: React.FC<{
  errors: string[]
  visible?: boolean
  onDismiss?: () => void
}> = ({ errors, visible = true, onDismiss }) => {
  if (!visible || errors.length === 0) return null

  return (
    <Alert
      type="error"
      title="Form Validation Errors"
      message={errors.length === 1 ? errors[0] : `${errors.length} validation errors found`}
      dismissible={!!onDismiss}
      onDismiss={onDismiss}
      className="mb-4"
    >
      {errors.length > 1 && (
        <ul className="mt-2 list-disc list-inside space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">
              {error}
            </li>
          ))}
        </ul>
      )}
    </Alert>
  )
}

// Custom hooks for email template operations
export const useEmailTemplateAlerts = () => {
  const { showToast } = useToast()
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'danger' | 'warning' | 'info'
    onConfirm: () => void
  } | null>(null)

  const showSuccess = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast(EmailTemplateToast.success(message, options))
  }, [showToast])

  const showError = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast(EmailTemplateToast.error(message, options))
  }, [showToast])

  const showWarning = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast(EmailTemplateToast.warning(message, options))
  }, [showToast])

  const showInfo = useCallback((message: string, options?: Partial<ToastProps>) => {
    return showToast(EmailTemplateToast.info(message, options))
  }, [showToast])

  const confirmDelete = useCallback((templateName: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Email Template',
      message: `Are you sure you want to delete the email template "${templateName}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        onConfirm()
        setConfirmDialog(null)
      }
    })
  }, [])

  const confirmReset = useCallback((templateName: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Email Template',
      message: `Are you sure you want to reset the email template "${templateName}" to its default values? This will overwrite any custom changes.`,
      type: 'warning',
      onConfirm: () => {
        onConfirm()
        setConfirmDialog(null)
      }
    })
  }, [])

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null)
  }, [])

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirmDelete,
    confirmReset,
    confirmDialog: confirmDialog ? (
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        confirmText={confirmDialog.type === 'danger' ? 'Delete' : 'Reset'}
      />
    ) : null
  }
}

// Export default
export default Alert