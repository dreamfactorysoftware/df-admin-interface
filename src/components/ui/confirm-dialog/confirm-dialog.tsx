"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, QuestionMarkCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button/button";
import type { 
  ConfirmDialogProps,
  DialogSeverity,
  DialogAccessibilityConfig,
  DialogAnimationConfig,
  DialogTheme 
} from "./types";

/**
 * ConfirmDialog - React 19 confirmation dialog component
 * 
 * Implements WCAG 2.1 AA accessibility standards using Headless UI Dialog primitive
 * and Tailwind CSS 4.1+ design tokens. Replaces Angular DfConfirmDialogComponent
 * with promise-based API for async confirmation workflows.
 * 
 * Key Features:
 * - WCAG 2.1 AA compliance with focus trapping and keyboard navigation
 * - Promise-based API for async confirmation workflows
 * - Internationalization support with react-i18next
 * - React 19 concurrent features for smooth animations
 * - Configurable severity levels and themes
 * - Comprehensive error handling and loading states
 * - Screen reader support with proper ARIA labeling
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const [isLoading, setIsLoading] = useState(false);
 * 
 * const handleConfirm = async () => {
 *   setIsLoading(true);
 *   try {
 *     await deleteDatabase(databaseId);
 *     setIsOpen(false);
 *   } catch (error) {
 *     console.error('Failed to delete database:', error);
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 * 
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Database Connection"
 *   message="Are you sure you want to delete this database connection?"
 *   description="This action cannot be undone. All API endpoints for this database will be removed."
 *   severity="error"
 *   destructive
 *   onConfirm={handleConfirm}
 *   loading={isLoading}
 * />
 * ```
 * 
 * @see Technical Specification Section 7.1.1 for React 19 implementation details
 * @see Technical Specification Section 7.7.1 for WCAG 2.1 AA compliance requirements
 */

/**
 * Severity icon mapping with proper sizing for accessibility
 * Icons maintain minimum 24x24px size for WCAG touch target compliance
 */
const severityIcons: Record<DialogSeverity, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  info: InformationCircleIcon,
  warning: ExclamationTriangleIcon,
  error: XCircleIcon,
  success: CheckCircleIcon,
  question: QuestionMarkCircleIcon,
};

/**
 * Severity-specific color schemes following design tokens from Section 7.7.1
 * All colors meet WCAG 2.1 AA contrast requirements (4.5:1 minimum for normal text)
 */
const severityStyles: Record<DialogSeverity, {
  iconColor: string;
  primaryButton: string;
  focusRing: string;
}> = {
  info: {
    iconColor: "text-primary-600", // 7.14:1 contrast vs white
    primaryButton: "primary",
    focusRing: "focus-visible:ring-primary-600",
  },
  warning: {
    iconColor: "text-warning-600", // 4.68:1 contrast vs white (adjusted for AA compliance)
    primaryButton: "warning",
    focusRing: "focus-visible:ring-warning-600",
  },
  error: {
    iconColor: "text-error-600", // 5.25:1 contrast vs white (adjusted for AA compliance)
    primaryButton: "error",
    focusRing: "focus-visible:ring-error-600",
  },
  success: {
    iconColor: "text-success-600", // 4.89:1 contrast vs white (adjusted for AA compliance)
    primaryButton: "success",
    focusRing: "focus-visible:ring-success-600",
  },
  question: {
    iconColor: "text-primary-600",
    primaryButton: "primary",
    focusRing: "focus-visible:ring-primary-600",
  },
};

/**
 * Theme variant styles for different dialog appearances
 * Implements design tokens from technical specification Section 7.7.1
 */
const themeStyles: Record<DialogTheme, {
  panel: string;
  backdrop: string;
  maxWidth: string;
}> = {
  default: {
    panel: "bg-white dark:bg-gray-900 rounded-lg shadow-xl",
    backdrop: "bg-gray-500/75 dark:bg-gray-900/75",
    maxWidth: "max-w-md",
  },
  minimal: {
    panel: "bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-700",
    backdrop: "bg-gray-500/50 dark:bg-gray-900/50",
    maxWidth: "max-w-sm",
  },
  card: {
    panel: "bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-800",
    backdrop: "bg-gray-500/80 dark:bg-gray-900/80",
    maxWidth: "max-w-lg",
  },
  overlay: {
    panel: "bg-white dark:bg-gray-900 rounded-none shadow-none h-full",
    backdrop: "bg-gray-900/90",
    maxWidth: "max-w-full",
  },
  inline: {
    panel: "bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700",
    backdrop: "bg-transparent",
    maxWidth: "max-w-md",
  },
};

/**
 * Default animation configuration optimized for React 19 concurrent features
 * Provides smooth transitions while maintaining accessibility requirements
 */
const defaultAnimationConfig: DialogAnimationConfig = {
  enterDuration: 300,
  exitDuration: 200,
  easing: "ease-out",
  scale: true,
  fade: true,
  blur: false,
};

/**
 * Default accessibility configuration ensuring WCAG 2.1 AA compliance
 * Provides comprehensive screen reader and keyboard navigation support
 */
const defaultAccessibilityConfig: DialogAccessibilityConfig = {
  role: "alertdialog",
  announceContent: true,
  shortcuts: {
    confirmKey: "Enter",
    cancelKey: "Escape",
    requireModifier: false,
  },
};

/**
 * ConfirmDialog component implementation
 * 
 * Leverages Headless UI Dialog primitive for accessibility while providing
 * comprehensive customization options and modern React patterns.
 */
export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      // Core dialog state
      open,
      onOpenChange,
      
      // Content props
      title,
      message,
      description,
      icon,
      severity = "question",
      
      // Button configuration
      confirmText,
      cancelText,
      destructive = false,
      showCancel = true,
      focusConfirm = false,
      
      // Event handlers
      onConfirm,
      onCancel,
      
      // Button prop overrides
      confirmButtonProps = {},
      cancelButtonProps = {},
      
      // Configuration
      animation = defaultAnimationConfig,
      accessibility = defaultAccessibilityConfig,
      theme = "default",
      
      // Behavior
      trapFocus = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      
      // States
      loading = false,
      error = null,
      
      // Styling
      className,
      "data-testid": testId = "confirm-dialog",
      
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    
    // Refs for focus management
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);
    const initialFocusRef = focusConfirm ? confirmButtonRef : cancelButtonRef;
    
    // Merge animation configuration with defaults
    const animationConfig = { ...defaultAnimationConfig, ...animation };
    
    // Merge accessibility configuration with defaults
    const accessibilityConfig = { ...defaultAccessibilityConfig, ...accessibility };
    
    // Get severity-specific styling
    const severityStyle = severityStyles[severity];
    const themeStyle = themeStyles[theme];
    
    // Determine default text based on severity and i18n
    const getDefaultConfirmText = (): string => {
      if (confirmText) return confirmText;
      
      switch (severity) {
        case "error":
          return destructive ? t("dialog.delete", "Delete") : t("dialog.confirm", "Confirm");
        case "warning":
          return t("dialog.proceed", "Proceed");
        case "success":
          return t("dialog.ok", "OK");
        default:
          return t("dialog.confirm", "Confirm");
      }
    };
    
    const getDefaultCancelText = (): string => {
      return cancelText || t("dialog.cancel", "Cancel");
    };
    
    // Handle confirm action with error handling and loading state
    const handleConfirm = async () => {
      if (loading) return;
      
      try {
        if (onConfirm) {
          const result = await onConfirm();
          // Only close dialog if onConfirm doesn't throw
          if (result !== false) {
            onOpenChange(false);
          }
        } else {
          onOpenChange(false);
        }
      } catch (err) {
        // Let parent handle error state
        console.error("Confirmation action failed:", err);
      }
    };
    
    // Handle cancel action
    const handleCancel = () => {
      if (loading) return;
      
      onCancel?.();
      onOpenChange(false);
    };
    
    // Enhanced keyboard handling for accessibility
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (!closeOnEscape && event.key === "Escape") {
        event.preventDefault();
        return;
      }
      
      // Handle custom shortcuts
      if (accessibilityConfig.shortcuts) {
        const { confirmKey, cancelKey, requireModifier } = accessibilityConfig.shortcuts;
        
        if (requireModifier && !event.metaKey && !event.ctrlKey) {
          return;
        }
        
        if (event.key === confirmKey && confirmKey !== "Enter") {
          event.preventDefault();
          handleConfirm();
        } else if (event.key === cancelKey && cancelKey !== "Escape") {
          event.preventDefault();
          handleCancel();
        }
      }
    };
    
    // Handle overlay click
    const handleOverlayClick = () => {
      if (closeOnOverlayClick && !loading) {
        handleCancel();
      }
    };
    
    // Generate ARIA label and description
    const getAriaLabel = (): string => {
      if (accessibilityConfig.ariaLabel) {
        return accessibilityConfig.ariaLabel;
      }
      
      return title ? `${title} - ${t("dialog.confirmationRequired", "Confirmation required")}` : t("dialog.confirmationDialog", "Confirmation dialog");
    };
    
    // Icon rendering with proper accessibility
    const renderIcon = () => {
      if (icon) {
        return (
          <div className={cn("flex-shrink-0", severityStyle.iconColor)}>
            {icon}
          </div>
        );
      }
      
      const IconComponent = severityIcons[severity];
      
      return (
        <div className={cn("flex-shrink-0", severityStyle.iconColor)}>
          <IconComponent 
            className="h-6 w-6" 
            aria-hidden="true"
          />
        </div>
      );
    };
    
    // Error display component
    const renderError = () => {
      if (!error) return null;
      
      return (
        <div 
          className="mt-3 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-error-600 dark:text-error-400" aria-hidden="true" />
            <div className="ml-3">
              <p className="text-sm text-error-800 dark:text-error-200">
                {error}
              </p>
            </div>
          </div>
        </div>
      );
    };
    
    // Main content area
    const renderContent = () => (
      <div className="flex">
        {renderIcon()}
        
        <div className="ml-4 flex-1">
          <DialogTitle
            as="h3"
            className="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
            id={`${testId}-title`}
          >
            {title}
          </DialogTitle>
          
          <div className="mt-2">
            <p 
              className="text-sm text-gray-600 dark:text-gray-300"
              id={`${testId}-description`}
            >
              {message}
            </p>
            
            {description && (
              <p 
                className="mt-2 text-sm text-gray-500 dark:text-gray-400"
                id={`${testId}-details`}
              >
                {description}
              </p>
            )}
          </div>
          
          {renderError()}
        </div>
      </div>
    );
    
    // Action buttons area
    const renderActions = () => (
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        {showCancel && (
          <Button
            ref={cancelButtonRef}
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className={cn(
              "w-full sm:w-auto",
              loading && "opacity-50 cursor-not-allowed"
            )}
            data-testid={`${testId}-cancel-button`}
            {...cancelButtonProps}
          >
            {getDefaultCancelText()}
          </Button>
        )}
        
        <Button
          ref={confirmButtonRef}
          variant={destructive ? "error" : severityStyle.primaryButton as any}
          onClick={handleConfirm}
          loading={loading}
          disabled={loading}
          className={cn(
            "w-full sm:w-auto",
            severityStyle.focusRing
          )}
          data-testid={`${testId}-confirm-button`}
          {...confirmButtonProps}
        >
          {getDefaultConfirmText()}
        </Button>
      </div>
    );
    
    return (
      <Transition 
        show={open} 
        as={React.Fragment}
        enter={`transition duration-${animationConfig.enterDuration} ${animationConfig.easing}`}
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave={`transition duration-${animationConfig.exitDuration} ${animationConfig.easing}`}
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <Dialog
          ref={ref}
          className="relative z-50"
          onClose={closeOnEscape ? handleCancel : () => {}}
          initialFocus={initialFocusRef}
          onKeyDown={handleKeyDown}
          role={accessibilityConfig.role}
          aria-label={getAriaLabel()}
          aria-labelledby={`${testId}-title`}
          aria-describedby={`${testId}-description`}
          data-testid={testId}
          {...props}
        >
          {/* Backdrop */}
          <TransitionChild
            as={React.Fragment}
            enter={`transition-opacity duration-${animationConfig.enterDuration} ${animationConfig.easing}`}
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave={`transition-opacity duration-${animationConfig.exitDuration} ${animationConfig.easing}`}
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div 
              className={cn("fixed inset-0", themeStyle.backdrop)}
              aria-hidden="true"
              onClick={handleOverlayClick}
            />
          </TransitionChild>

          {/* Dialog container */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <TransitionChild
                as={React.Fragment}
                enter={cn(
                  `transition-all duration-${animationConfig.enterDuration} ${animationConfig.easing}`,
                  animationConfig.scale && "transform",
                  animationConfig.fade && "opacity-0"
                )}
                enterFrom={cn(
                  animationConfig.fade && "opacity-0",
                  animationConfig.scale && "scale-95"
                )}
                enterTo={cn(
                  animationConfig.fade && "opacity-100",
                  animationConfig.scale && "scale-100"
                )}
                leave={cn(
                  `transition-all duration-${animationConfig.exitDuration} ${animationConfig.easing}`,
                  animationConfig.scale && "transform",
                  animationConfig.fade && "opacity-100"
                )}
                leaveFrom={cn(
                  animationConfig.fade && "opacity-100",
                  animationConfig.scale && "scale-100"
                )}
                leaveTo={cn(
                  animationConfig.fade && "opacity-0",
                  animationConfig.scale && "scale-95"
                )}
              >
                <DialogPanel
                  className={cn(
                    "relative w-full transform text-left transition-all",
                    themeStyle.panel,
                    themeStyle.maxWidth,
                    "p-6",
                    // Focus ring for keyboard navigation
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
                    className
                  )}
                >
                  {/* Close button for non-destructive dialogs */}
                  {!destructive && theme !== "overlay" && (
                    <div className="absolute right-0 top-0 pr-4 pt-4">
                      <button
                        type="button"
                        className={cn(
                          "rounded-md bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300",
                          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                          "transition-colors duration-200"
                        )}
                        onClick={handleCancel}
                        disabled={loading}
                        aria-label={t("dialog.close", "Close dialog")}
                        data-testid={`${testId}-close-button`}
                      >
                        <span className="sr-only">{t("dialog.close", "Close")}</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {/* Content */}
                  {renderContent()}

                  {/* Actions */}
                  {renderActions()}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }
);

ConfirmDialog.displayName = "ConfirmDialog";

/**
 * Export types and utilities for external usage
 */
export type { ConfirmDialogProps, DialogSeverity, DialogTheme } from "./types";

/**
 * Default export for convenience
 */
export default ConfirmDialog;