'use client';

import React from 'react';
import { Portal } from '@/components/ui/portal';
import { LoadingSpinner } from '@/components/layout/loading/loading-spinner';
import { 
  useIsLoading, 
  useCurrentOperation, 
  useLoadingActions,
  type LoadingOperation 
} from '@/stores/loading-store';
import { cn } from '@/lib/utils';

/**
 * Global Loader Props Interface
 */
export interface GlobalLoaderProps {
  /**
   * Whether to show the loader in a portal (outside component tree)
   * @default true
   */
  usePortal?: boolean;
  
  /**
   * Portal container selector or element
   * @default 'body'
   */
  portalContainer?: string | Element;
  
  /**
   * Custom CSS classes for the overlay
   */
  className?: string;
  
  /**
   * Custom z-index for the overlay
   * @default 50
   */
  zIndex?: number;
  
  /**
   * Blur intensity for the backdrop
   * @default 'sm'
   */
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Whether to show operation details
   * @default true
   */
  showDetails?: boolean;
  
  /**
   * Whether to show cancel button for cancellable operations
   * @default true
   */
  showCancelButton?: boolean;
  
  /**
   * Maximum time to show a single operation before auto-hiding (in ms)
   * @default undefined (no auto-hide)
   */
  autoHideTimeout?: number;
  
  /**
   * Custom render function for operation content
   */
  renderOperation?: (operation: LoadingOperation) => React.ReactNode;
  
  /**
   * Callback when an operation is cancelled
   */
  onCancel?: (operation: LoadingOperation) => void;
  
  /**
   * Whether to animate the entrance/exit
   * @default true
   */
  animated?: boolean;
}

/**
 * Operation Display Component
 * Shows the current loading operation with details and cancel button
 */
interface OperationDisplayProps {
  operation: LoadingOperation;
  showDetails: boolean;
  showCancelButton: boolean;
  onCancel?: (operation: LoadingOperation) => void;
  renderOperation?: (operation: LoadingOperation) => React.ReactNode;
}

function OperationDisplay({
  operation,
  showDetails,
  showCancelButton,
  onCancel,
  renderOperation,
}: OperationDisplayProps) {
  const { cancelLoading } = useLoadingActions();
  
  const handleCancel = React.useCallback(() => {
    if (operation.cancelToken && !operation.cancelToken.signal.aborted) {
      cancelLoading(operation.id);
      onCancel?.(operation);
    }
  }, [operation, cancelLoading, onCancel]);

  // Use custom render function if provided
  if (renderOperation) {
    return <>{renderOperation(operation)}</>;
  }

  const canCancel = operation.cancelToken && !operation.cancelToken.signal.aborted;

  return (
    <div className="text-center space-y-4">
      {/* Operation Label */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {operation.label}
        </h3>
        
        {/* Operation Description */}
        {showDetails && operation.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {operation.description}
          </p>
        )}
      </div>

      {/* Operation Metadata (in development) */}
      {process.env.NODE_ENV === 'development' && showDetails && (
        <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
          <div>ID: {operation.id}</div>
          <div>Category: {operation.category}</div>
          <div>Priority: {operation.priority}</div>
          <div>Started: {new Date(operation.timestamp).toLocaleTimeString()}</div>
        </div>
      )}

      {/* Cancel Button */}
      {showCancelButton && canCancel && (
        <button
          onClick={handleCancel}
          className={cn(
            'inline-flex items-center justify-center',
            'px-4 py-2 text-sm font-medium',
            'text-gray-700 dark:text-gray-300',
            'bg-white dark:bg-gray-800',
            'border border-gray-300 dark:border-gray-600',
            'rounded-lg shadow-sm',
            'hover:bg-gray-50 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={`Cancel ${operation.label}`}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

/**
 * Global Loader Component
 * 
 * A centralized loading overlay component that provides application-wide loading
 * state management with modal overlay presentation. Built on React 19 with 
 * Zustand state management, Headless UI Portal integration, and comprehensive
 * cancellation token support.
 * 
 * This component replaces Angular's loading interceptor patterns with a modern
 * React approach that supports:
 * - Multiple concurrent loading operations with intelligent queueing
 * - Priority-based operation display
 * - Cancellation token support for aborting operations
 * - Integration with authentication flows and navigation states
 * - Proper z-index management through Portal rendering
 * - WCAG 2.1 AA accessibility compliance
 * - Server-side rendering compatibility
 * 
 * The component automatically subscribes to the global loading store and renders
 * an overlay when operations are active, displaying the highest-priority operation
 * with its label, description, and optional cancel button.
 * 
 * @example
 * // Basic usage in app layout
 * <GlobalLoader />
 * 
 * @example
 * // Custom configuration
 * <GlobalLoader
 *   backdropBlur="md"
 *   showCancelButton={false}
 *   zIndex={60}
 *   autoHideTimeout={30000}
 * />
 * 
 * @example
 * // Custom operation rendering
 * <GlobalLoader
 *   renderOperation={(operation) => (
 *     <CustomLoadingUI operation={operation} />
 *   )}
 * />
 */
export function GlobalLoader({
  usePortal = true,
  portalContainer = 'body',
  className,
  zIndex = 50,
  backdropBlur = 'sm',
  showDetails = true,
  showCancelButton = true,
  autoHideTimeout,
  renderOperation,
  onCancel,
  animated = true,
}: GlobalLoaderProps) {
  const isLoading = useIsLoading();
  const currentOperation = useCurrentOperation();
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  // Auto-hide timeout management
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  // Handle loading state changes with animation
  React.useEffect(() => {
    if (isLoading && currentOperation) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show immediately or animate in
      if (animated) {
        setIsVisible(true);
        // Small delay for enter animation
        setTimeout(() => setIsAnimating(true), 10);
      } else {
        setIsVisible(true);
        setIsAnimating(true);
      }

      // Set auto-hide timeout if specified
      if (autoHideTimeout && autoHideTimeout > 0) {
        timeoutRef.current = setTimeout(() => {
          if (currentOperation?.cancelToken && !currentOperation.cancelToken.signal.aborted) {
            currentOperation.cancelToken.abort();
          }
        }, autoHideTimeout);
      }
    } else {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Hide immediately or animate out
      if (animated) {
        setIsAnimating(false);
        // Wait for exit animation before hiding
        setTimeout(() => setIsVisible(false), 200);
      } else {
        setIsVisible(false);
        setIsAnimating(false);
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, currentOperation, animated, autoHideTimeout]);

  // Don't render if not visible or no current operation
  if (!isVisible || !currentOperation) {
    return null;
  }

  // Overlay styles with custom z-index and backdrop blur
  const overlayStyles: React.CSSProperties = {
    zIndex,
  };

  const overlayClasses = cn(
    // Base overlay styles
    'fixed inset-0 flex items-center justify-center',
    'bg-white/80 dark:bg-gray-900/80',
    
    // Backdrop blur variants
    {
      'backdrop-blur-none': backdropBlur === 'none',
      'backdrop-blur-sm': backdropBlur === 'sm',
      'backdrop-blur-md': backdropBlur === 'md',
      'backdrop-blur-lg': backdropBlur === 'lg',
    },
    
    // Animation classes
    animated && {
      'transition-all duration-200 ease-in-out': true,
      'opacity-0 scale-95': !isAnimating,
      'opacity-100 scale-100': isAnimating,
    },
    
    // Custom classes
    className
  );

  const loaderContent = (
    <div
      className={overlayClasses}
      style={overlayStyles}
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-loader-title"
      aria-describedby={currentOperation.description ? "global-loader-description" : undefined}
      aria-live="polite"
      aria-busy="true"
    >
      {/* Main loading container */}
      <div className={cn(
        'flex flex-col items-center space-y-6 p-8',
        'bg-white dark:bg-gray-800',
        'rounded-xl shadow-2xl',
        'border border-gray-200 dark:border-gray-700',
        'max-w-md w-full mx-4',
        animated && {
          'transition-all duration-200 delay-75': true,
          'transform translate-y-4 opacity-0': !isAnimating,
          'transform translate-y-0 opacity-100': isAnimating,
        }
      )}>
        {/* Loading Spinner */}
        <LoadingSpinner
          size="xl"
          variant="primary"
          speed="normal"
          label=""
          aria-hidden="true"
        />

        {/* Operation Details */}
        <div id="global-loader-title">
          <OperationDisplay
            operation={currentOperation}
            showDetails={showDetails}
            showCancelButton={showCancelButton}
            onCancel={onCancel}
            renderOperation={renderOperation}
          />
        </div>
      </div>
    </div>
  );

  // Render with or without portal
  if (usePortal) {
    return (
      <Portal container={portalContainer} enabled={isVisible}>
        {loaderContent}
      </Portal>
    );
  }

  return loaderContent;
}

/**
 * Hook for managing global loading operations
 * Provides convenient methods for starting, completing, and canceling loading operations
 */
export function useGlobalLoader() {
  const actions = useLoadingActions();
  
  return {
    /**
     * Start a new loading operation
     * @param operation - Operation configuration
     * @returns Operation ID for later reference
     */
    showLoader: (operation: Omit<LoadingOperation, 'id' | 'timestamp'>) => {
      return actions.startLoading(operation);
    },
    
    /**
     * Complete a loading operation
     * @param operationId - ID of the operation to complete
     */
    hideLoader: (operationId: string) => {
      actions.completeLoading(operationId);
    },
    
    /**
     * Cancel a loading operation
     * @param operationId - ID of the operation to cancel
     */
    cancelLoader: (operationId: string) => {
      actions.cancelLoading(operationId);
    },
    
    /**
     * Cancel all active loading operations
     */
    cancelAllLoaders: () => {
      actions.cancelAllLoading();
    },
    
    /**
     * Create a scoped loader for a specific operation
     * @param defaultOperation - Default operation configuration
     */
    createScopedLoader: (defaultOperation: Partial<Omit<LoadingOperation, 'id' | 'timestamp'>>) => {
      let currentOperationId: string | null = null;
      
      return {
        show: (overrides?: Partial<Omit<LoadingOperation, 'id' | 'timestamp'>>) => {
          const operation = { ...defaultOperation, ...overrides };
          if (!operation.label) {
            throw new Error('Loading operation must have a label');
          }
          currentOperationId = actions.startLoading(operation as Omit<LoadingOperation, 'id' | 'timestamp'>);
          return currentOperationId;
        },
        hide: () => {
          if (currentOperationId) {
            actions.completeLoading(currentOperationId);
            currentOperationId = null;
          }
        },
        cancel: () => {
          if (currentOperationId) {
            actions.cancelLoading(currentOperationId);
            currentOperationId = null;
          }
        },
        get isActive() {
          return currentOperationId !== null;
        },
        get operationId() {
          return currentOperationId;
        },
      };
    },
  };
}

// Export types for external usage
export type { GlobalLoaderProps, OperationDisplayProps };

// Default export for convenience
export default GlobalLoader;