/**
 * Connection Test Button Component
 * 
 * React component that renders a connection test button with loading states, success/error 
 * feedback, and integration with the connection testing hook. Provides immediate visual 
 * feedback during connection testing and displays appropriate icons and messages based on 
 * test results. Optimized for React 19 patterns with TypeScript 5.8+ and Tailwind CSS 4.1+.
 * 
 * @fileoverview Database connection test button with real-time feedback
 * @version 1.0.0
 * @since React 19.0.0, Next.js 15.1+, TypeScript 5.8+
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useFormContext, type FieldPath } from 'react-hook-form';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClockIcon,
  WifiIcon,
  SignalIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useConnectionTest } from './use-connection-test';
import type { 
  DatabaseConnectionFormData, 
  ConnectionTestResult, 
  BaseComponentProps 
} from '../types';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

/**
 * Connection test button component props
 */
export interface ConnectionTestButtonProps extends BaseComponentProps {
  /** Form field path to watch for configuration changes */
  configPath?: FieldPath<DatabaseConnectionFormData>;
  
  /** Connection configuration to test (overrides form data) */
  config?: Partial<DatabaseConnectionFormData>;
  
  /** Button size variant */
  size?: 'sm' | 'default' | 'lg';
  
  /** Button layout variant */
  variant?: 'default' | 'outline' | 'secondary';
  
  /** Custom button text for idle state */
  idleText?: string;
  
  /** Custom button text for testing state */
  testingText?: string;
  
  /** Custom button text for success state */
  successText?: string;
  
  /** Custom button text for error state */
  errorText?: string;
  
  /** Auto-hide success state after delay (ms) */
  autoHideSuccess?: number;
  
  /** Auto-hide error state after delay (ms) */
  autoHideError?: number;
  
  /** Enable retry functionality */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Show test duration */
  showDuration?: boolean;
  
  /** Show retry count */
  showRetryCount?: boolean;
  
  /** Disable button */
  disabled?: boolean;
  
  /** Custom disabled tooltip */
  disabledTooltip?: string;
  
  /** Connection test success callback */
  onTestSuccess?: (result: ConnectionTestResult) => void;
  
  /** Connection test error callback */
  onTestError?: (error: string, result?: ConnectionTestResult) => void;
  
  /** Connection test start callback */
  onTestStart?: () => void;
  
  /** Connection test complete callback */
  onTestComplete?: (result: ConnectionTestResult) => void;
  
  /** Connection test cancel callback */
  onTestCancel?: () => void;
  
  /** Enable real-time form validation on change */
  enableRealTimeValidation?: boolean;
  
  /** Validation debounce delay in milliseconds */
  validationDebounce?: number;
  
  /** Test timeout in milliseconds */
  timeout?: number;
  
  /** Enable cancellation during test */
  enableCancellation?: boolean;
  
  /** Hide button text (icon only) */
  iconOnly?: boolean;
  
  /** Custom loading icon */
  loadingIcon?: React.ComponentType<{ className?: string }>;
  
  /** Custom success icon */
  successIcon?: React.ComponentType<{ className?: string }>;
  
  /** Custom error icon */
  errorIcon?: React.ComponentType<{ className?: string }>;
  
  /** Custom idle icon */
  idleIcon?: React.ComponentType<{ className?: string }>;
}

/**
 * Connection test state for UI display
 */
interface ConnectionTestState {
  /** Current status */
  status: 'idle' | 'testing' | 'success' | 'error' | 'cancelled';
  
  /** Display message */
  message: string;
  
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>;
  
  /** Button variant */
  variant: 'default' | 'outline' | 'secondary';
  
  /** Button color classes */
  colorClasses: string;
  
  /** Show spinner */
  showSpinner: boolean;
  
  /** Allow click */
  clickable: boolean;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats test duration for display
 */
const formatTestDuration = (duration: number | null): string => {
  if (!duration) return '';
  
  if (duration < 1000) {
    return `${duration}ms`;
  } else if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(duration / 60000);
    const seconds = ((duration % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
};

/**
 * Validates if connection config is complete enough for testing
 */
const isConfigValidForTesting = (config: Partial<DatabaseConnectionFormData>): boolean => {
  if (!config.type || !config.host || !config.database) {
    return false;
  }
  
  // SQLite doesn't require username/password
  if (config.type === 'sqlite') {
    return true;
  }
  
  return !!(config.username && config.password);
};

/**
 * Gets connection test state configuration
 */
const getConnectionTestState = (
  status: 'idle' | 'testing' | 'success' | 'error',
  result: ConnectionTestResult | null,
  error: any,
  retryCount: number,
  maxRetries: number,
  props: ConnectionTestButtonProps
): ConnectionTestState => {
  const {
    idleText = 'Test Connection',
    testingText = 'Testing...',
    successText = 'Connected',
    errorText = 'Test Failed',
    enableRetry = true,
    showRetryCount = false
  } = props;
  
  switch (status) {
    case 'testing':
      return {
        status: 'testing',
        message: testingText,
        icon: props.loadingIcon || ArrowPathIcon,
        variant: 'outline',
        colorClasses: 'border-blue-300 text-blue-700 hover:bg-blue-50 focus:ring-blue-500',
        showSpinner: true,
        clickable: false
      };
      
    case 'success':
      return {
        status: 'success',
        message: result?.testDuration ? 
          `${successText} (${formatTestDuration(result.testDuration)})` : 
          successText,
        icon: props.successIcon || CheckCircleIconSolid,
        variant: 'outline',
        colorClasses: 'border-green-300 text-green-700 hover:bg-green-50 focus:ring-green-500',
        showSpinner: false,
        clickable: true
      };
      
    case 'error':
      const errorMessage = error?.error?.message || result?.message || 'Connection failed';
      const retryText = enableRetry && retryCount > 0 && showRetryCount ? 
        ` (Retry ${retryCount}/${maxRetries})` : '';
      
      return {
        status: 'error',
        message: `${errorText}${retryText}`,
        icon: props.errorIcon || ExclamationCircleIcon,
        variant: 'outline',
        colorClasses: 'border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500',
        showSpinner: false,
        clickable: enableRetry
      };
      
    default: // idle
      return {
        status: 'idle',
        message: idleText,
        icon: props.idleIcon || WifiIcon,
        variant: 'default',
        colorClasses: '',
        showSpinner: false,
        clickable: true
      };
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Connection Test Button Component
 * 
 * Renders a button for testing database connections with real-time feedback,
 * loading states, and comprehensive error handling. Integrates with React Hook Form
 * for automatic form validation and provides immediate visual feedback during
 * connection testing.
 * 
 * @param props - Connection test button props
 * @returns JSX element
 */
export const ConnectionTestButton: React.FC<ConnectionTestButtonProps> = (props) => {
  const {
    configPath,
    config,
    size = 'default',
    variant: propVariant,
    autoHideSuccess = 3000,
    autoHideError = 0, // Don't auto-hide errors
    enableRetry = true,
    maxRetries = 3,
    showDuration = true,
    showRetryCount = false,
    disabled = false,
    disabledTooltip,
    onTestSuccess,
    onTestError,
    onTestStart,
    onTestComplete,
    onTestCancel,
    enableRealTimeValidation = false,
    validationDebounce = 500,
    timeout = 10000,
    enableCancellation = true,
    iconOnly = false,
    className,
    'data-testid': dataTestId = 'connection-test-button',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    ...restProps
  } = props;
  
  // Form integration
  const formContext = useFormContext<DatabaseConnectionFormData>();
  const { watch, formState: { errors } } = formContext || {};
  
  // Watch form data if configPath is provided
  const watchedConfig = watch ? watch(configPath as any) : null;
  
  // Determine active configuration
  const activeConfig = config || watchedConfig || {};
  
  // Connection test hook
  const {
    testConnection,
    result,
    isLoading,
    error,
    status,
    retry,
    cancel,
    testDuration,
    retryCount
  } = useConnectionTest({
    enableRetry,
    maxRetries,
    timeout,
    onSuccess: (result) => {
      onTestSuccess?.(result);
      onTestComplete?.(result);
    },
    onError: (error) => {
      const errorMessage = error.error?.message || 'Connection test failed';
      onTestError?.(errorMessage, result || undefined);
      onTestComplete?.(result || {
        success: false,
        message: errorMessage,
        testDuration: testDuration || 0,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Local state for UI feedback
  const [displayState, setDisplayState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Update display state based on hook status
  useEffect(() => {
    if (status === 'testing') {
      setDisplayState('testing');
      // Clear any existing timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
        setAutoHideTimer(null);
      }
    } else if (status === 'success') {
      setDisplayState('success');
      // Auto-hide success state if configured
      if (autoHideSuccess > 0) {
        const timer = setTimeout(() => {
          setDisplayState('idle');
          setAutoHideTimer(null);
        }, autoHideSuccess);
        setAutoHideTimer(timer);
      }
    } else if (status === 'error') {
      setDisplayState('error');
      // Auto-hide error state if configured
      if (autoHideError > 0) {
        const timer = setTimeout(() => {
          setDisplayState('idle');
          setAutoHideTimer(null);
        }, autoHideError);
        setAutoHideTimer(timer);
      }
    } else {
      setDisplayState('idle');
    }
    
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, [status, autoHideSuccess, autoHideError]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
    };
  }, []);
  
  // Check if config is valid for testing
  const isConfigValid = isConfigValidForTesting(activeConfig);
  const isFormInvalid = formContext && Object.keys(errors).length > 0;
  const isButtonDisabled = disabled || !isConfigValid || isFormInvalid;
  
  // Get current test state configuration
  const testState = getConnectionTestState(
    displayState,
    result,
    error,
    retryCount,
    maxRetries,
    props
  );
  
  // Handle test button click
  const handleTestClick = useCallback(async () => {
    if (isButtonDisabled || !testState.clickable) {
      return;
    }
    
    // If currently testing and cancellation is enabled, cancel the test
    if (displayState === 'testing' && enableCancellation) {
      cancel();
      onTestCancel?.();
      return;
    }
    
    // If in error state with retry enabled, retry the test
    if (displayState === 'error' && enableRetry) {
      try {
        onTestStart?.();
        await retry();
      } catch (error) {
        // Error handled by hook callbacks
      }
      return;
    }
    
    // Start new test
    try {
      onTestStart?.();
      await testConnection(activeConfig as DatabaseConnectionFormData);
    } catch (error) {
      // Error handled by hook callbacks
    }
  }, [
    isButtonDisabled,
    testState.clickable,
    displayState,
    enableCancellation,
    enableRetry,
    cancel,
    onTestCancel,
    retry,
    onTestStart,
    testConnection,
    activeConfig
  ]);
  
  // Determine button variant
  const buttonVariant = propVariant || testState.variant;
  
  // Build button classes
  const buttonClasses = cn(
    // Base classes
    'relative transition-all duration-200',
    // State-specific classes
    testState.colorClasses,
    // Custom classes
    className
  );
  
  // Render button icon
  const renderIcon = () => {
    const IconComponent = testState.icon;
    const iconClasses = cn(
      'flex-shrink-0 transition-transform duration-200',
      {
        'w-4 h-4': size === 'sm',
        'w-5 h-5': size === 'default',
        'w-6 h-6': size === 'lg',
        'animate-spin': testState.showSpinner,
        'mr-2': !iconOnly
      }
    );
    
    return <IconComponent className={iconClasses} />;
  };
  
  // Render button content
  const renderButtonContent = () => {
    return (
      <div className="flex items-center justify-center">
        {renderIcon()}
        {!iconOnly && (
          <span className="font-medium">
            {testState.message}
          </span>
        )}
        {/* Show cancellation option during testing */}
        {displayState === 'testing' && enableCancellation && (
          <XMarkIcon className="w-4 h-4 ml-2 opacity-70 hover:opacity-100 transition-opacity" />
        )}
      </div>
    );
  };
  
  // Render disabled tooltip if needed
  const getDisabledTooltip = () => {
    if (disabled && disabledTooltip) {
      return disabledTooltip;
    }
    
    if (!isConfigValid) {
      return 'Please fill in required connection details';
    }
    
    if (isFormInvalid) {
      return 'Please fix form validation errors';
    }
    
    return undefined;
  };
  
  const tooltipText = getDisabledTooltip();
  
  return (
    <div className="relative">
      <Button
        type="button"
        variant={buttonVariant}
        size={size}
        disabled={isButtonDisabled}
        onClick={handleTestClick}
        className={buttonClasses}
        data-testid={dataTestId}
        aria-label={ariaLabel || `${testState.message}${tooltipText ? ` - ${tooltipText}` : ''}`}
        aria-describedby={ariaDescribedby}
        title={tooltipText}
        {...restProps}
      >
        {renderButtonContent()}
      </Button>
      
      {/* Connection status indicator */}
      {(displayState === 'success' || displayState === 'error') && (
        <div className="absolute -top-1 -right-1">
          <div className={cn(
            'w-3 h-3 rounded-full border-2 border-white',
            {
              'bg-green-500': displayState === 'success',
              'bg-red-500': displayState === 'error'
            }
          )} />
        </div>
      )}
      
      {/* Test duration display */}
      {showDuration && testDuration && displayState === 'success' && (
        <div className="absolute -bottom-6 left-0 right-0 text-center">
          <span className="inline-flex items-center text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
            <ClockIcon className="w-3 h-3 mr-1" />
            {formatTestDuration(testDuration)}
          </span>
        </div>
      )}
      
      {/* Retry count display */}
      {showRetryCount && retryCount > 0 && displayState === 'error' && (
        <div className="absolute -bottom-6 right-0">
          <span className="inline-flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {retryCount}/{maxRetries}
          </span>
        </div>
      )}
      
      {/* Connection strength indicator for successful connections */}
      {displayState === 'success' && result?.metadata?.responseTime && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded text-xs text-green-700">
            <SignalIcon className="w-3 h-3" />
            <span>{result.metadata.responseTime}ms</span>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// DISPLAY NAME AND EXPORTS
// =============================================================================

ConnectionTestButton.displayName = 'ConnectionTestButton';

export default ConnectionTestButton;

// Export types for external use
export type {
  ConnectionTestButtonProps,
  ConnectionTestState
};

// Export utility functions
export {
  formatTestDuration,
  isConfigValidForTesting,
  getConnectionTestState
};