/**
 * Paywall Component - React Migration from Angular df-paywall
 * 
 * Displays subscription prompts, trial information, and feature highlights with
 * integrated Calendly booking widget. Migrated from Angular DfPaywallComponent
 * to React 19 with enhanced accessibility, responsive design, and error handling.
 * 
 * @fileoverview React paywall component for DreamFactory Admin Interface
 * @version 1.0.0
 * @requires React 19.0.0, Next.js 15.1+, TypeScript 5.8+, Tailwind CSS 4.1+
 */

import React, { 
  forwardRef, 
  useEffect, 
  useRef, 
  useImperativeHandle, 
  useState, 
  useCallback,
  useMemo 
} from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import type { 
  PaywallProps,
  PaywallRef,
  CalendlyConfig,
  CalendlyState,
  CalendlyEvent,
  PaywallLoadingState,
  PaywallErrorState,
  DEFAULT_PAYWALL_TRANSLATIONS,
  PAYWALL_TRANSLATION_NAMESPACE
} from './types';

// ============================================================================
// CALENDLY INTEGRATION TYPES
// ============================================================================

/**
 * Calendly global object type for external script integration
 */
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (config: {
        url: string;
        parentElement: HTMLElement;
        autoLoad?: boolean;
        [key: string]: any;
      }) => void;
      destroyWidget: (element: HTMLElement) => void;
      showPopupWidget: (url: string, options?: Record<string, any>) => void;
    };
  }
}

// ============================================================================
// CALENDLY ERROR BOUNDARY
// ============================================================================

/**
 * Error boundary specifically for Calendly widget integration
 */
interface CalendlyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CalendlyErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    onError?: (error: Error) => void;
    fallback?: React.ReactNode;
  }>,
  CalendlyErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): CalendlyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendly widget error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div 
          className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"
          role="alert"
          aria-live="polite"
        >
          <div className="text-center space-y-4">
            <div className="text-6xl text-gray-400 dark:text-gray-600">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Scheduling Widget Unavailable
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              The scheduling widget encountered an error. Please try refreshing the page or contact us directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
              <a
                href="mailto:info@dreamfactory.com"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// CALENDLY WIDGET COMPONENT
// ============================================================================

/**
 * Calendly widget integration component with error handling and loading states
 */
interface CalendlyWidgetProps {
  config: CalendlyConfig;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onEvent?: (event: CalendlyEvent) => void;
  className?: string;
  'aria-label'?: string;
}

const CalendlyWidget = React.memo<CalendlyWidgetProps>(({
  config,
  onLoad,
  onError,
  onEvent,
  className,
  'aria-label': ariaLabel = 'Calendly scheduling widget'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CalendlyState>({
    loading: true,
    loaded: false,
    error: null,
    visible: true,
    height: config.height || 700,
    lastLoaded: null,
    loadAttempts: 0
  });

  const initializeWidget = useCallback(async () => {
    if (!containerRef.current || !window.Calendly) {
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      loadAttempts: prev.loadAttempts + 1 
    }));

    try {
      // Clear existing widget if any
      if (containerRef.current.firstChild) {
        containerRef.current.innerHTML = '';
      }

      // Initialize Calendly widget
      window.Calendly.initInlineWidget({
        url: config.url,
        parentElement: containerRef.current,
        autoLoad: config.autoLoad ?? true,
        ...config
      });

      setState(prev => ({
        ...prev,
        loading: false,
        loaded: true,
        error: null,
        lastLoaded: Date.now()
      }));

      onLoad?.();
    } catch (error) {
      const widgetError = error instanceof Error ? error : new Error('Calendly widget initialization failed');
      
      setState(prev => ({
        ...prev,
        loading: false,
        loaded: false,
        error: widgetError
      }));

      onError?.(widgetError);
    }
  }, [config, onLoad, onError]);

  // Load Calendly script and initialize widget
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let retryId: NodeJS.Timeout;

    const loadCalendlyScript = () => {
      // Check if Calendly is already loaded
      if (window.Calendly) {
        initializeWidget();
        return;
      }

      // Load Calendly script
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        initializeWidget();
      };
      script.onerror = () => {
        const error = new Error('Failed to load Calendly script');
        setState(prev => ({ ...prev, loading: false, error }));
        onError?.(error);
      };

      document.head.appendChild(script);

      // Cleanup function
      return () => {
        document.head.removeChild(script);
      };
    };

    // Set loading timeout
    if (config.loadTimeout) {
      timeoutId = setTimeout(() => {
        const error = new Error('Calendly widget load timeout');
        setState(prev => ({ ...prev, loading: false, error }));
        onError?.(error);
      }, config.loadTimeout);
    }

    // Load script
    const cleanup = loadCalendlyScript();

    // Retry logic for failed loads
    if (state.error && config.retryAttempts && state.loadAttempts < config.retryAttempts) {
      retryId = setTimeout(() => {
        initializeWidget();
      }, 3000); // Retry after 3 seconds
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (retryId) clearTimeout(retryId);
      cleanup?.();
    };
  }, [initializeWidget, config.loadTimeout, config.retryAttempts, state.error, state.loadAttempts]);

  // Render loading state
  if (state.loading) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700',
          className
        )}
        style={{ minHeight: config.minHeight || 400 }}
        role="status"
        aria-live="polite"
        aria-label="Loading scheduling widget"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Loading scheduling widget...
        </p>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div 
        className={cn(
          'flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800',
          className
        )}
        style={{ minHeight: config.minHeight || 400 }}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-red-600 dark:text-red-400 text-center space-y-2">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-semibold">Widget Loading Error</h3>
          <p className="text-sm">
            {state.error.message || 'Failed to load scheduling widget'}
          </p>
          {config.retryAttempts && state.loadAttempts < config.retryAttempts && (
            <button
              onClick={initializeWidget}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Retry ({state.loadAttempts}/{config.retryAttempts})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        'calendly-inline-widget w-full',
        className
      )}
      style={{ 
        minHeight: config.minHeight || 400,
        height: config.height || 700,
        maxHeight: config.maxHeight || 800
      }}
      aria-label={ariaLabel}
      role="application"
    />
  );
});

CalendlyWidget.displayName = 'CalendlyWidget';

// ============================================================================
// MAIN PAYWALL COMPONENT
// ============================================================================

/**
 * Paywall component with Calendly integration and comprehensive accessibility
 */
export const Paywall = forwardRef<PaywallRef, PaywallProps>(({
  className,
  style,
  variant = 'default',
  size = 'md',
  headerContent,
  footerContent,
  showContactInfo = true,
  showCalendlyWidget = true,
  calendlyConfig,
  containerClassName,
  widgetClassName,
  responsive,
  loading = false,
  error = null,
  onMount,
  onCalendlyLoad,
  onCalendlyError,
  onCalendlyEvent,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-labelledby': ariaLabelledBy,
  role = 'main',
  tabIndex,
  autoFocus = false,
  translationNamespace = PAYWALL_TRANSLATION_NAMESPACE,
  translations = DEFAULT_PAYWALL_TRANSLATIONS,
  locale,
  ...props
}, ref) => {
  // Refs for imperative access
  const containerRef = useRef<HTMLDivElement>(null);
  const calendlyRef = useRef<HTMLDivElement>(null);

  // Component state
  const [calendlyState, setCalendlyState] = useState<CalendlyState>({
    loading: false,
    loaded: false,
    error: null,
    visible: showCalendlyWidget,
    height: 700,
    lastLoaded: null,
    loadAttempts: 0
  });

  // Translation hook
  const { t, ready: translationReady } = useTranslation(translationNamespace, {
    fallback: 'Translation unavailable',
    enableHtml: true
  });

  // Default Calendly configuration
  const defaultCalendlyConfig: CalendlyConfig = useMemo(() => ({
    url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
    mode: 'inline',
    height: 700,
    minHeight: 400,
    maxHeight: 800,
    hideEventDetails: false,
    hideEventDuration: false,
    hidePageDetails: false,
    primaryColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    autoLoad: true,
    loadTimeout: 15000,
    retryAttempts: 3,
    onLoad: onCalendlyLoad,
    onError: onCalendlyError,
    ...calendlyConfig
  }), [calendlyConfig, onCalendlyLoad, onCalendlyError]);

  // Imperative methods for ref
  useImperativeHandle(ref, () => ({
    containerRef,
    calendlyRef,
    initializeCalendly: async () => {
      // Re-initialize Calendly widget
      setCalendlyState(prev => ({ ...prev, loading: true, error: null }));
    },
    destroyCalendly: () => {
      if (calendlyRef.current && window.Calendly?.destroyWidget) {
        window.Calendly.destroyWidget(calendlyRef.current);
      }
      setCalendlyState(prev => ({ ...prev, loaded: false, loading: false }));
    },
    refreshCalendly: async () => {
      // Refresh the widget
      setCalendlyState(prev => ({ ...prev, loading: true }));
    },
    focus: () => {
      containerRef.current?.focus();
    },
    scrollIntoView: (options?: ScrollIntoViewOptions) => {
      containerRef.current?.scrollIntoView(options);
    },
    getCalendlyState: () => calendlyState,
    updateCalendlyConfig: async (config: Partial<CalendlyConfig>) => {
      // Update configuration and reinitialize
      Object.assign(defaultCalendlyConfig, config);
    }
  }), [calendlyState, defaultCalendlyConfig]);

  // Component lifecycle
  useEffect(() => {
    onMount?.();
    
    if (autoFocus) {
      containerRef.current?.focus();
    }
  }, [onMount, autoFocus]);

  // Handle Calendly events
  const handleCalendlyLoad = useCallback(() => {
    setCalendlyState(prev => ({ 
      ...prev, 
      loading: false, 
      loaded: true, 
      error: null,
      lastLoaded: Date.now()
    }));
    onCalendlyLoad?.();
  }, [onCalendlyLoad]);

  const handleCalendlyError = useCallback((error: Error) => {
    setCalendlyState(prev => ({ 
      ...prev, 
      loading: false, 
      error,
      loadAttempts: prev.loadAttempts + 1
    }));
    onCalendlyError?.(error);
  }, [onCalendlyError]);

  // Component classes based on variant and responsive design
  const componentClasses = useMemo(() => {
    const baseClasses = [
      'paywall-container',
      'flex',
      'flex-col',
      'items-center',
      'max-w-6xl',
      'mx-auto',
      'px-4',
      'py-8',
      'space-y-8'
    ];

    // Variant-specific classes
    switch (variant) {
      case 'enterprise':
        baseClasses.push('bg-gradient-to-br', 'from-blue-50', 'to-indigo-100', 'dark:from-blue-900/20', 'dark:to-indigo-900/20');
        break;
      case 'trial':
        baseClasses.push('bg-gradient-to-br', 'from-green-50', 'to-emerald-100', 'dark:from-green-900/20', 'dark:to-emerald-900/20');
        break;
      case 'minimal':
        baseClasses.push('py-4', 'space-y-4');
        break;
      case 'modal':
        baseClasses.push('bg-white', 'dark:bg-gray-800', 'rounded-lg', 'shadow-xl', 'border', 'border-gray-200', 'dark:border-gray-700');
        break;
      default:
        baseClasses.push('bg-white', 'dark:bg-gray-900');
    }

    // Size-specific classes
    switch (size) {
      case 'sm':
        baseClasses.push('max-w-2xl', 'py-4', 'space-y-4');
        break;
      case 'lg':
        baseClasses.push('max-w-7xl', 'py-12', 'space-y-12');
        break;
      case 'xl':
        baseClasses.push('max-w-full', 'py-16', 'space-y-16');
        break;
    }

    return cn(baseClasses, containerClassName, className);
  }, [variant, size, containerClassName, className]);

  // Responsive layout classes for info columns
  const infoColumnsClasses = useMemo(() => {
    const baseClasses = [
      'info-columns',
      'flex',
      'gap-8',
      'justify-between',
      'w-full',
      'max-w-4xl'
    ];

    // Responsive breakpoint at 768px (md in Tailwind)
    baseClasses.push('flex-col', 'md:flex-row');

    return cn(baseClasses);
  }, []);

  // Loading state
  if (loading || !translationReady) {
    return (
      <div 
        className={componentClasses}
        role="status"
        aria-live="polite"
        aria-label="Loading paywall content"
      >
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={cn(componentClasses, 'bg-red-50', 'dark:bg-red-900/20', 'border', 'border-red-200', 'dark:border-red-800')}
        role="alert"
        aria-live="assertive"
      >
        <div className="text-center space-y-4">
          <div className="text-red-600 dark:text-red-400">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Content Unavailable</h2>
            <p className="text-sm">
              {typeof error === 'string' ? error : 'An error occurred while loading the content.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={componentClasses}
      style={style}
      role={role}
      aria-label={ariaLabel || t('screenReaderDescription')}
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      tabIndex={tabIndex}
      {...props}
    >
      {/* Header Section */}
      <header className="text-center space-y-4 max-w-4xl">
        {headerContent || (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {t('header')}
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
              {t('subheader')}
            </h2>
          </>
        )}
      </header>

      {/* Details Section */}
      <section 
        className="details-section w-full max-w-4xl"
        aria-labelledby="paywall-details"
      >
        <div className={infoColumnsClasses}>
          <div className="info-column flex-1 space-y-4">
            <h3 
              id="hosted-trial"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              {t('hostedTrialTitle')}
            </h3>
            <div 
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('hostedTrialContent') }}
              aria-describedby="hosted-trial"
            />
          </div>
          
          <div className="info-column flex-1 space-y-4">
            <h3 
              id="learn-more"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100"
            >
              {t('learnMoreTitle')}
            </h3>
            <p 
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
              aria-describedby="learn-more"
            >
              {t('learnMoreContent')}
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100">
          {t('speakToHumanTitle')}
        </h2>
      </section>

      {/* Calendly Widget Section */}
      {showCalendlyWidget && (
        <section 
          className="w-full max-w-4xl"
          aria-labelledby="scheduling-widget"
        >
          <CalendlyErrorBoundary
            onError={handleCalendlyError}
            fallback={
              <div className="text-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('calendlyErrorMessage')}
                </p>
                <div className="mt-4 space-y-2">
                  <a
                    href="tel:+14159935877"
                    className="block text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('phoneLabel')}: +1 415-993-5877
                  </a>
                  <a
                    href="mailto:info@dreamfactory.com"
                    className="block text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t('emailLabel')}: info@dreamfactory.com
                  </a>
                </div>
              </div>
            }
          >
            <CalendlyWidget
              config={defaultCalendlyConfig}
              onLoad={handleCalendlyLoad}
              onError={handleCalendlyError}
              onEvent={onCalendlyEvent}
              className={cn(
                'calendly-inline-widget',
                'shadow-lg',
                'rounded-lg',
                'border',
                'border-gray-200',
                'dark:border-gray-700',
                'overflow-hidden',
                widgetClassName
              )}
              aria-label={t('widgetContainerLabel')}
            />
          </CalendlyErrorBoundary>
        </section>
      )}

      {/* Contact Information Section */}
      {showContactInfo && (
        <footer 
          className="paywall-contact w-full text-center py-8 border-t border-gray-200 dark:border-gray-700"
          aria-labelledby="contact-info"
        >
          <h3 
            id="contact-info"
            className="sr-only"
          >
            {t('contactInfoLabel')}
          </h3>
          <div className="space-y-2 text-lg">
            <a
              href="tel:+14159935877"
              className="inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Call DreamFactory support at +1 415-993-5877"
            >
              {t('phoneLabel')}: +1 415-993-5877
            </a>
            <span className="mx-2 text-gray-400">|</span>
            <a
              href="mailto:info@dreamfactory.com"
              className="inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Email DreamFactory support at info@dreamfactory.com"
            >
              {t('emailLabel')}: info@dreamfactory.com
            </a>
          </div>
        </footer>
      )}

      {/* Custom Footer Content */}
      {footerContent && (
        <footer className="w-full">
          {footerContent}
        </footer>
      )}
    </div>
  );
});

Paywall.displayName = 'Paywall';

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export default Paywall;
export { CalendlyWidget, CalendlyErrorBoundary };
export type { PaywallProps, PaywallRef };