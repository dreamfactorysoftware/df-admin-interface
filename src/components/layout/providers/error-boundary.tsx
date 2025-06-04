/**
 * React Error Boundary Component for DreamFactory Admin Interface
 * 
 * Comprehensive error boundary implementation that catches JavaScript errors in component tree,
 * provides accessible fallback UI, and integrates with error reporting systems. Replaces Angular
 * DfErrorService with React error handling patterns and includes recovery mechanisms.
 * 
 * Features:
 * - Component tree error catching with fallback UI rendering
 * - Error reporting integration with stack trace capture and user session context
 * - Retry mechanisms for recoverable errors with exponential backoff strategies
 * - Accessible error UI with clear messaging and recovery action buttons
 * - Error state clearing on successful navigation matching Angular error service behavior
 * 
 * @version 1.0.0
 * @requires React 19.0.0 for enhanced error boundary capabilities
 * @requires Next.js 15.1+ for navigation integration and middleware support
 * @requires TypeScript 5.8+ for enhanced type safety and React 19 support
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ErrorState, 
  GlobalError, 
  ComponentError, 
  ErrorType, 
  ErrorSeverity, 
  ErrorUserContext,
  ErrorRecoveryStrategy,
  ErrorReportingConfig
} from './provider-types';

// =============================================================================
// Error Boundary Props and State Interfaces
// =============================================================================

/**
 * Error boundary component props with configuration options
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary protection */
  children: ReactNode;
  /** Error boundary identifier for debugging and reporting */
  boundaryId?: string;
  /** Fallback component to render on error */
  fallback?: ComponentType<ErrorFallbackProps>;
  /** Enable error reporting to external services */
  enableReporting?: boolean;
  /** Custom error recovery strategies */
  recoveryStrategies?: ErrorRecoveryStrategy[];
  /** Error reporting configuration */
  reportingConfig?: Partial<ErrorReportingConfig>;
  /** Development mode flag for enhanced debugging */
  developmentMode?: boolean;
  /** Callback fired when error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Callback fired when error boundary resets */
  onReset?: () => void;
  /** Maximum retry attempts for recovery */
  maxRetries?: number;
  /** Enable automatic retry on error */
  enableAutoRetry?: boolean;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Error boundary internal state
 */
export interface ErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** Current error information */
  error: Error | null;
  /** React error info with component stack */
  errorInfo: ErrorInfo | null;
  /** Global error object with enhanced metadata */
  globalError: GlobalError | null;
  /** Current retry attempt count */
  retryCount: number;
  /** Error recovery status */
  isRecovering: boolean;
  /** Last recovery attempt timestamp */
  lastRecoveryAttempt: number | null;
  /** Error boundary identifier */
  boundaryId: string;
  /** User context when error occurred */
  userContext: ErrorUserContext | null;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  /** Error that occurred */
  error: Error;
  /** React error info */
  errorInfo: ErrorInfo;
  /** Global error with enhanced metadata */
  globalError: GlobalError;
  /** Reset error boundary function */
  resetError: () => void;
  /** Retry error recovery function */
  retryRecovery: () => Promise<void>;
  /** Whether recovery is in progress */
  isRecovering: boolean;
  /** Current retry attempt count */
  retryCount: number;
  /** Maximum retry attempts allowed */
  maxRetries: number;
  /** Error boundary identifier */
  boundaryId: string;
}

// =============================================================================
// Error Boundary Class Component
// =============================================================================

/**
 * React Error Boundary class component for comprehensive error handling
 * 
 * Implements React's Error Boundary pattern with enhanced features including:
 * - Automatic error reporting with user context
 * - Retry mechanisms with exponential backoff
 * - Accessible fallback UI with recovery actions
 * - Integration with navigation for error clearing
 */
class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private reportingEnabled: boolean;
  private recoveryStrategies: ErrorRecoveryStrategy[];
  private maxRetries: number;
  private retryDelay: number;
  
  /**
   * Default error reporting configuration
   */
  private readonly defaultReportingConfig: ErrorReportingConfig = {
    enabled: true,
    includeUserContext: true,
    includeStackTrace: true,
    sampleRate: 1.0,
    maxErrorsPerSession: 10,
    ignoredErrors: [
      'ChunkLoadError',
      'Loading chunk',
      'Network Error',
      'ResizeObserver loop limit exceeded'
    ]
  };

  /**
   * Default error recovery strategies
   */
  private readonly defaultRecoveryStrategies: ErrorRecoveryStrategy[] = [
    {
      id: 'component-refresh',
      errorTypes: ['JAVASCRIPT_ERROR', 'UNKNOWN_ERROR'],
      action: {
        name: 'refresh-component',
        description: 'Reset component state and re-render',
        handler: async () => {
          this.resetErrorBoundary();
        },
        label: 'Try Again',
        icon: 'refresh-cw'
      },
      maxRetries: 3,
      retryDelay: 1000,
      isSuccessful: () => !this.state.hasError
    },
    {
      id: 'page-reload',
      errorTypes: ['NETWORK_ERROR', 'API_ERROR'],
      action: {
        name: 'reload-page',
        description: 'Reload the current page',
        handler: async () => {
          window.location.reload();
        },
        label: 'Reload Page',
        icon: 'rotate-ccw'
      },
      maxRetries: 1,
      retryDelay: 2000,
      isSuccessful: () => true
    }
  ];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.reportingEnabled = props.enableReporting ?? true;
    this.recoveryStrategies = props.recoveryStrategies ?? this.defaultRecoveryStrategies;
    this.maxRetries = props.maxRetries ?? 3;
    this.retryDelay = props.retryDelay ?? 1000;

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      globalError: null,
      retryCount: 0,
      isRecovering: false,
      lastRecoveryAttempt: null,
      boundaryId: props.boundaryId ?? `error-boundary-${Date.now()}`,
      userContext: null
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      retryCount: 0,
      isRecovering: false
    };
  }

  /**
   * Component did catch error lifecycle method
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const userContext = this.captureUserContext();
    const globalError = this.createGlobalError(error, errorInfo, userContext);

    this.setState({
      errorInfo,
      globalError,
      userContext
    });

    // Report error if enabled
    if (this.reportingEnabled) {
      this.reportError(globalError);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error in development mode
    if (this.props.developmentMode) {
      console.error('Error Boundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    // Attempt automatic recovery if enabled
    if (this.props.enableAutoRetry && this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  }

  /**
   * Component will unmount lifecycle method
   */
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Capture current user context for error reporting
   */
  private captureUserContext(): ErrorUserContext {
    const userAgent = navigator.userAgent;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Parse browser information from user agent
    const browserInfo = this.parseBrowserInfo(userAgent);
    const osInfo = this.parseOSInfo(userAgent);

    return {
      currentRoute: window.location.pathname,
      userAgent,
      viewport,
      browser: browserInfo,
      os: osInfo
    };
  }

  /**
   * Parse browser information from user agent
   */
  private parseBrowserInfo(userAgent: string): { name: string; version: string } {
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+\.\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+\.\d+)/ },
      { name: 'Safari', pattern: /Safari\/(\d+\.\d+)/ },
      { name: 'Edge', pattern: /Edg\/(\d+\.\d+)/ }
    ];

    for (const browser of browsers) {
      const match = userAgent.match(browser.pattern);
      if (match) {
        return { name: browser.name, version: match[1] };
      }
    }

    return { name: 'Unknown', version: '0.0' };
  }

  /**
   * Parse operating system information from user agent
   */
  private parseOSInfo(userAgent: string): { name: string; version: string } {
    const systems = [
      { name: 'Windows', pattern: /Windows NT (\d+\.\d+)/ },
      { name: 'macOS', pattern: /Mac OS X (\d+[._]\d+)/ },
      { name: 'Linux', pattern: /Linux/ },
      { name: 'iOS', pattern: /iPhone OS (\d+[._]\d+)/ },
      { name: 'Android', pattern: /Android (\d+\.\d+)/ }
    ];

    for (const system of systems) {
      const match = userAgent.match(system.pattern);
      if (match) {
        return { 
          name: system.name, 
          version: match[1]?.replace('_', '.') ?? '0.0' 
        };
      }
    }

    return { name: 'Unknown', version: '0.0' };
  }

  /**
   * Create global error object with enhanced metadata
   */
  private createGlobalError(
    error: Error, 
    errorInfo: ErrorInfo, 
    userContext: ErrorUserContext
  ): GlobalError {
    const errorType = this.classifyError(error);
    const severity = this.determineSeverity(error, errorType);

    return {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userContext,
      timestamp: Date.now(),
      severity,
      recoveryAttempts: 0,
      metadata: {
        boundaryId: this.state.boundaryId,
        errorName: error.name,
        errorConstructor: error.constructor.name,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Classify error type based on error characteristics
   */
  private classifyError(error: Error): ErrorType {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    
    if (errorMessage.includes('chunkerror') || errorMessage.includes('loading chunk')) {
      return 'JAVASCRIPT_ERROR';
    }
    
    if (errorName.includes('typeerror') || errorName.includes('referenceerror')) {
      return 'JAVASCRIPT_ERROR';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      return 'AUTHENTICATION_ERROR';
    }
    
    if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      return 'AUTHORIZATION_ERROR';
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Determine error severity based on error type and characteristics
   */
  private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    switch (type) {
      case 'AUTHENTICATION_ERROR':
      case 'AUTHORIZATION_ERROR':
        return 'high';
      case 'NETWORK_ERROR':
      case 'API_ERROR':
        return 'medium';
      case 'VALIDATION_ERROR':
        return 'low';
      case 'JAVASCRIPT_ERROR':
        return error.stack?.includes('useState') || error.stack?.includes('useEffect') 
          ? 'medium' 
          : 'high';
      default:
        return 'medium';
    }
  }

  /**
   * Report error to external error reporting service
   */
  private async reportError(globalError: GlobalError): Promise<void> {
    const config = { ...this.defaultReportingConfig, ...this.props.reportingConfig };
    
    // Check if error should be ignored
    if (config.ignoredErrors.some(pattern => globalError.message.includes(pattern))) {
      return;
    }

    // Apply sampling rate
    if (Math.random() > config.sampleRate) {
      return;
    }

    // Prepare error payload
    const errorPayload = {
      ...globalError,
      userContext: config.includeUserContext ? globalError.userContext : undefined,
      stack: config.includeStackTrace ? globalError.stack : undefined,
      reportedAt: new Date().toISOString()
    };

    try {
      // Send to error reporting endpoint if configured
      if (config.endpoint) {
        await fetch(config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorPayload)
        });
      }

      // Log to console in development mode
      if (this.props.developmentMode) {
        console.error('Error reported:', errorPayload);
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Schedule automatic retry with exponential backoff
   */
  private scheduleRetry(): void {
    const delay = this.calculateRetryDelay(this.state.retryCount);
    
    this.retryTimeoutId = setTimeout(() => {
      this.attemptRecovery();
    }, delay);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(this.retryDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds
  }

  /**
   * Attempt error recovery using available strategies
   */
  private attemptRecovery = async (): Promise<void> => {
    if (this.state.isRecovering || !this.state.globalError) return;

    this.setState({ 
      isRecovering: true, 
      lastRecoveryAttempt: Date.now() 
    });

    const applicableStrategies = this.recoveryStrategies.filter(strategy =>
      strategy.errorTypes.includes(this.state.globalError!.type)
    );

    for (const strategy of applicableStrategies) {
      try {
        await strategy.action.handler();
        
        if (strategy.isSuccessful()) {
          this.setState({
            isRecovering: false,
            retryCount: this.state.retryCount + 1
          });
          return;
        }
      } catch (recoveryError) {
        console.error('Recovery strategy failed:', recoveryError);
      }
    }

    // If all strategies failed, increment retry count
    this.setState({
      isRecovering: false,
      retryCount: this.state.retryCount + 1
    });

    // Schedule another retry if under max attempts
    if (this.state.retryCount < this.maxRetries) {
      this.scheduleRetry();
    }
  };

  /**
   * Reset error boundary to initial state
   */
  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      globalError: null,
      retryCount: 0,
      isRecovering: false,
      lastRecoveryAttempt: null,
      userContext: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Render error boundary component
   */
  render(): ReactNode {
    if (this.state.hasError && this.state.error && this.state.errorInfo && this.state.globalError) {
      const FallbackComponent = this.props.fallback ?? DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          globalError={this.state.globalError}
          resetError={this.resetErrorBoundary}
          retryRecovery={this.attemptRecovery}
          isRecovering={this.state.isRecovering}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          boundaryId={this.state.boundaryId}
        />
      );
    }

    return this.props.children;
  }
}

// =============================================================================
// Default Error Fallback Component
// =============================================================================

/**
 * Default accessible error fallback UI component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  globalError,
  resetError,
  retryRecovery,
  isRecovering,
  retryCount,
  maxRetries,
  boundaryId
}) => {
  const canRetry = retryCount < maxRetries;
  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div 
      className="min-h-[400px] flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg"
      role="alert"
      aria-labelledby={`error-title-${boundaryId}`}
      aria-describedby={`error-description-${boundaryId}`}
    >
      <div className="max-w-md w-full text-center space-y-4">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Title */}
        <h2 
          id={`error-title-${boundaryId}`}
          className="text-xl font-semibold text-red-900"
        >
          Something went wrong
        </h2>

        {/* Error Description */}
        <div id={`error-description-${boundaryId}`} className="space-y-2">
          <p className="text-red-700">
            We encountered an unexpected error. We're sorry for the inconvenience.
          </p>
          
          {showDetails && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                Show technical details
              </summary>
              <div className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 font-mono">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                <div className="mb-2">
                  <strong>Type:</strong> {globalError.type}
                </div>
                <div className="mb-2">
                  <strong>Severity:</strong> {globalError.severity}
                </div>
                {retryCount > 0 && (
                  <div>
                    <strong>Retry attempts:</strong> {retryCount} / {maxRetries}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            aria-describedby={`error-description-${boundaryId}`}
          >
            Try Again
          </button>

          {canRetry && (
            <button
              onClick={retryRecovery}
              disabled={isRecovering}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-describedby={`error-description-${boundaryId}`}
            >
              {isRecovering ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                  Recovering...
                </span>
              ) : (
                'Auto Recover'
              )}
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Additional Help */}
        <div className="text-sm text-red-600">
          If this problem persists, please contact support with error ID: 
          <code className="ml-1 px-1 bg-red-100 rounded text-red-800">
            {globalError.id.slice(-8)}
          </code>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Navigation Integration Hook
// =============================================================================

/**
 * Custom hook for navigation-based error clearing
 * Replaces Angular error service navigation behavior
 */
const useNavigationErrorClearing = (onClearError: () => void) => {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    // Clear errors on successful navigation
    onClearError();
  }, [pathname, onClearError]);

  return { pathname, router };
};

// =============================================================================
// Higher-Order Component Wrapper
// =============================================================================

/**
 * Higher-order component wrapper for easy error boundary integration
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
): ComponentType<P> {
  const WithErrorBoundaryComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundaryComponent.displayName = 
    `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

// =============================================================================
// Main Export Component with Navigation Integration
// =============================================================================

/**
 * Main Error Boundary component with navigation integration
 * Provides automatic error clearing on navigation changes
 */
export const ErrorBoundary: React.FC<ErrorBoundaryProps> = (props) => {
  const errorBoundaryRef = React.useRef<ErrorBoundaryComponent>(null);

  const handleClearError = React.useCallback(() => {
    if (errorBoundaryRef.current) {
      errorBoundaryRef.current.resetErrorBoundary();
    }
  }, []);

  // Integrate with Next.js navigation for error clearing
  useNavigationErrorClearing(handleClearError);

  return (
    <ErrorBoundaryComponent
      ref={errorBoundaryRef}
      {...props}
    />
  );
};

// Set display name for debugging
ErrorBoundary.displayName = 'ErrorBoundary';

// =============================================================================
// Type Exports
// =============================================================================

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps
};

// =============================================================================
// Default Export
// =============================================================================

export default ErrorBoundary;