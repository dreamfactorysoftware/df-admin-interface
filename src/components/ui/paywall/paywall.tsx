/**
 * React Paywall Component
 * 
 * Migrated from Angular df-paywall implementation to React 19 functional component
 * with Next.js 15.1 compatibility, Tailwind CSS 4.1+ styling, and Calendly integration.
 * 
 * Features:
 * - React 19 hooks for lifecycle management
 * - react-i18next for internationalization with Transloco compatibility
 * - Tailwind CSS for responsive design
 * - WCAG 2.1 AA accessibility compliance
 * - Calendly external service integration
 * - Progressive enhancement support
 * - Error boundary integration
 * - TypeScript 5.8+ strict typing
 * 
 * @fileoverview Paywall component for DreamFactory premium feature access
 * @version 1.0.0
 */

'use client';

import React, {
  forwardRef,
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  useMemo
} from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';
import type {
  PaywallProps,
  PaywallRef,
  CalendlyEvent,
  PaywallLoadingState,
  PaywallErrorState
} from './types';

// Calendly widget script URL for external integration
const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js';

// Default Calendly URL from requirements
const DEFAULT_CALENDLY_URL = 'https://calendly.com/dreamfactory-platform/unlock-all-features';

/**
 * React Paywall Component
 * 
 * Displays subscription prompts, trial information, and feature highlights with
 * integrated Calendly booking widget. Replaces Angular df-paywall implementation
 * with React 19 patterns, maintaining exact translation key compatibility.
 */
export const Paywall = forwardRef<PaywallRef, PaywallProps>(({
  isVisible = false,
  variant = 'modal',
  requiredLevel,
  currentLevel = 'free',
  feature,
  content,
  translations,
  analytics,
  calendlyConfig,
  showCalendly = true,
  calendlyClassName = '',
  loadingState,
  errorState,
  
  // Event Handlers
  onUpgradeClick,
  onSecondaryAction,
  onDismiss,
  onShow,
  onHide,
  onCalendlyEventScheduled,
  onCalendlyLoad,
  onCalendlyError,
  
  // Accessibility and UX
  autoShow = false,
  closeOnEscape = true,
  closeOnBackdrop = true,
  trapFocus = true,
  restoreFocus = true,
  focusTargetOnClose,
  
  // Styling
  className = '',
  containerClassName = '',
  contentClassName = '',
  headerClassName = '',
  footerClassName = '',
  primaryActionClassName = '',
  secondaryActionClassName = '',
  backdropClassName = '',
  
  // Advanced Configuration
  renderContent,
  renderHeader,
  renderFooter,
  renderActions,
  
  // Responsive Design
  mobileVariant,
  tabletVariant,
  desktopVariant,
  
  // Animation
  enterAnimation = 'fade',
  exitAnimation = 'fade',
  animationDuration = 300,
  showDelay = 0,
  
  // Testing and Development
  'data-testid': testId = 'paywall',
  debugMode = false,
  mockMode = false,
  
  // Base props
  id,
  role = 'dialog',
  'aria-modal': ariaModal = variant === 'modal',
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  tabIndex = -1,
  ...htmlProps
}, ref) => {
  // Hooks and State
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const calendlyContainerRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Component state
  const [isVisibleState, setIsVisibleState] = useState(autoShow || isVisible);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  const [calendlyError, setCalendlyError] = useState<Error | null>(null);
  const [internalLoading, setInternalLoading] = useState<PaywallLoadingState>({
    isLoading: false,
    calendlyLoading: false,
    widgetProgress: 0,
    loadingStage: 'initializing'
  });
  const [internalError, setInternalError] = useState<PaywallErrorState>({
    hasError: false,
    calendlyError: false,
    networkError: false,
    configError: false
  });

  // Memoized values
  const effectiveVariant = useMemo(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768 && mobileVariant) return mobileVariant;
      if (width < 1024 && tabletVariant) return tabletVariant;
      if (desktopVariant) return desktopVariant;
    }
    return variant;
  }, [variant, mobileVariant, tabletVariant, desktopVariant]);

  const calendlyUrl = useMemo(() => {
    return calendlyConfig?.url || DEFAULT_CALENDLY_URL;
  }, [calendlyConfig?.url]);

  const shouldShowUpgrade = useMemo(() => {
    const levelHierarchy: Record<string, number> = {
      free: 0,
      starter: 1,
      professional: 2,
      enterprise: 3,
      trial: 1
    };
    return levelHierarchy[currentLevel] < levelHierarchy[requiredLevel];
  }, [currentLevel, requiredLevel]);

  const translationKeys = useMemo(() => ({
    titleKey: translations?.titleKey || 'paywall.header',
    descriptionKey: translations?.descriptionKey || 'paywall.subheader',
    primaryActionKey: translations?.primaryActionKey || 'paywall.upgradeNow',
    secondaryActionKey: translations?.secondaryActionKey || 'paywall.scheduleMeeting',
    closeButtonKey: translations?.closeButtonKey || 'paywall.close',
    featuresKey: translations?.featuresKey || ['paywall.features'],
    contactSalesKey: translations?.contactSalesKey || 'paywall.contactSales',
    loadingKey: translations?.loadingKey || 'paywall.loading',
    errorKey: translations?.errorKey || 'paywall.error',
    ...translations
  }), [translations]);

  // Calendly script loading
  const loadCalendlyScript = useCallback(async (): Promise<void> => {
    if (mockMode) {
      setCalendlyLoaded(true);
      onCalendlyLoad?.();
      return;
    }

    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector('script[src="' + CALENDLY_SCRIPT_URL + '"]')) {
        if (window.Calendly) {
          setCalendlyLoaded(true);
          onCalendlyLoad?.();
          resolve();
        } else {
          // Script exists but not loaded yet, wait for it
          const checkCalendly = () => {
            if (window.Calendly) {
              setCalendlyLoaded(true);
              onCalendlyLoad?.();
              resolve();
            } else {
              setTimeout(checkCalendly, 100);
            }
          };
          checkCalendly();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = CALENDLY_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        setCalendlyLoaded(true);
        onCalendlyLoad?.();
        resolve();
      };
      script.onerror = (error) => {
        const calendlyError = new Error('Failed to load Calendly widget script');
        setCalendlyError(calendlyError);
        setInternalError(prev => ({
          ...prev,
          hasError: true,
          calendlyError: true,
          networkError: true
        }));
        onCalendlyError?.(calendlyError);
        reject(calendlyError);
      };
      
      document.head.appendChild(script);
    });
  }, [mockMode, onCalendlyLoad, onCalendlyError]);

  // Initialize Calendly widget
  const initializeCalendlyWidget = useCallback(async (): Promise<void> => {
    if (!calendlyContainerRef.current || !showCalendly || mockMode) return;

    try {
      setInternalLoading(prev => ({
        ...prev,
        calendlyLoading: true,
        loadingStage: 'loading-calendly'
      }));

      await loadCalendlyScript();

      if (window.Calendly && calendlyContainerRef.current) {
        // Clear any existing widget
        calendlyContainerRef.current.innerHTML = '';

        const options = {
          height: 500,
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: '#6366f1',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          ...calendlyConfig?.options
        };

        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: calendlyContainerRef.current,
          ...options
        });

        // Set up event listeners if provided
        if (calendlyConfig?.onEventScheduled || onCalendlyEventScheduled) {
          window.addEventListener('message', (event) => {
            if (event.origin !== 'https://calendly.com') return;
            
            if (event.data.event && event.data.event === 'calendly.event_scheduled') {
              const calendlyEvent: CalendlyEvent = {
                eventUuid: event.data.payload?.event?.uuid || '',
                eventTypeUuid: event.data.payload?.event_type?.uuid || '',
                invitee: {
                  name: event.data.payload?.invitee?.name || '',
                  email: event.data.payload?.invitee?.email || '',
                  phone: event.data.payload?.invitee?.phone,
                  customResponses: event.data.payload?.invitee?.custom_responses || {}
                },
                event: {
                  startTime: event.data.payload?.event?.start_time || '',
                  endTime: event.data.payload?.event?.end_time || '',
                  location: event.data.payload?.event?.location,
                  joinUrl: event.data.payload?.event?.join_url
                }
              };
              
              calendlyConfig?.onEventScheduled?.(calendlyEvent);
              onCalendlyEventScheduled?.(calendlyEvent);
            }
          });
        }

        setInternalLoading(prev => ({
          ...prev,
          calendlyLoading: false,
          loadingStage: 'ready'
        }));
      }
    } catch (error) {
      const calendlyError = error instanceof Error ? error : new Error('Failed to initialize Calendly widget');
      setCalendlyError(calendlyError);
      setInternalError(prev => ({
        ...prev,
        hasError: true,
        calendlyError: true
      }));
      setInternalLoading(prev => ({
        ...prev,
        calendlyLoading: false,
        loadingStage: 'ready'
      }));
      onCalendlyError?.(calendlyError);
    }
  }, [calendlyUrl, calendlyConfig, showCalendly, mockMode, loadCalendlyScript, onCalendlyEventScheduled, onCalendlyError]);

  // Visibility management
  const showPaywall = useCallback(() => {
    if (showDelay > 0) {
      setTimeout(() => {
        setIsVisibleState(true);
        onShow?.();
      }, showDelay);
    } else {
      setIsVisibleState(true);
      onShow?.();
    }
  }, [showDelay, onShow]);

  const hidePaywall = useCallback(() => {
    setIsVisibleState(false);
    onHide?.();
    
    // Restore focus if needed
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
    } else if (focusTargetOnClose) {
      const target = typeof focusTargetOnClose === 'string' 
        ? document.querySelector(focusTargetOnClose) as HTMLElement
        : focusTargetOnClose;
      target?.focus();
    }
  }, [onHide, restoreFocus, focusTargetOnClose]);

  const togglePaywall = useCallback(() => {
    if (isVisibleState) {
      hidePaywall();
    } else {
      showPaywall();
    }
  }, [isVisibleState, hidePaywall, showPaywall]);

  // Focus management
  const focusPrimaryAction = useCallback(() => {
    primaryActionRef.current?.focus();
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setCalendlyError(null);
    setInternalError({
      hasError: false,
      calendlyError: false,
      networkError: false,
      configError: false
    });
    setInternalLoading({
      isLoading: false,
      calendlyLoading: false,
      widgetProgress: 0,
      loadingStage: 'initializing'
    });
  }, []);

  // Calendly utility functions
  const isCalendlyLoadedFn = useCallback(() => calendlyLoaded, [calendlyLoaded]);
  
  const refreshCalendly = useCallback(() => {
    if (calendlyContainerRef.current) {
      calendlyContainerRef.current.innerHTML = '';
      setCalendlyLoaded(false);
      initializeCalendlyWidget();
    }
  }, [initializeCalendlyWidget]);

  // Keyboard event handling
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      handleDismiss();
    }
  }, [closeOnEscape]);

  // Event handlers
  const handleDismiss = useCallback(() => {
    onDismiss?.();
    hidePaywall();
  }, [onDismiss, hidePaywall]);

  const handleUpgradeClick = useCallback(() => {
    onUpgradeClick?.(requiredLevel);
    
    // Analytics tracking
    if (analytics?.trackUpgradeClicks) {
      analytics.onAnalyticsEvent?.('paywall_upgrade_click', {
        requiredLevel,
        currentLevel,
        feature: feature?.featureId,
        variant: effectiveVariant
      });
    }
  }, [onUpgradeClick, requiredLevel, currentLevel, feature, effectiveVariant, analytics]);

  const handleSecondaryAction = useCallback((action: string) => {
    onSecondaryAction?.(action);
    
    // Analytics tracking
    if (analytics?.trackCalendlyInteractions && action === 'schedule_meeting') {
      analytics.onAnalyticsEvent?.('paywall_calendly_click', {
        requiredLevel,
        currentLevel,
        feature: feature?.featureId
      });
    }
  }, [onSecondaryAction, requiredLevel, currentLevel, feature, analytics]);

  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      handleDismiss();
    }
  }, [closeOnBackdrop, handleDismiss]);

  // Effects
  useEffect(() => {
    setIsVisibleState(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (isVisibleState && showCalendly) {
      initializeCalendlyWidget();
    }
  }, [isVisibleState, showCalendly, initializeCalendlyWidget]);

  useEffect(() => {
    if (isVisibleState) {
      // Store previous focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus management for modal variant
      if (effectiveVariant === 'modal' && trapFocus) {
        // Focus the primary action button after a short delay
        setTimeout(() => {
          focusPrimaryAction();
        }, 100);
      }

      // Analytics tracking
      if (analytics?.trackImpressions) {
        analytics.onAnalyticsEvent?.('paywall_impression', {
          requiredLevel,
          currentLevel,
          feature: feature?.featureId,
          variant: effectiveVariant
        });
      }
    }
  }, [isVisibleState, effectiveVariant, trapFocus, focusPrimaryAction, analytics, requiredLevel, currentLevel, feature]);

  // Imperative handle for ref
  useImperativeHandle(ref, () => ({
    element: containerRef.current,
    show: showPaywall,
    hide: hidePaywall,
    toggle: togglePaywall,
    focusPrimaryAction,
    reset,
    isCalendlyLoaded: isCalendlyLoadedFn,
    refreshCalendly
  }), [showPaywall, hidePaywall, togglePaywall, focusPrimaryAction, reset, isCalendlyLoadedFn, refreshCalendly]);

  // Early return if not visible and not in modal variant
  if (!isVisibleState && effectiveVariant !== 'modal') {
    return null;
  }

  // Combine loading states
  const combinedLoadingState = {
    ...internalLoading,
    ...loadingState,
    isLoading: internalLoading.isLoading || loadingState?.isLoading || false
  };

  // Combine error states
  const combinedErrorState = {
    ...internalError,
    ...errorState,
    hasError: internalError.hasError || errorState?.hasError || false
  };

  // Don't show if user already has access
  if (!shouldShowUpgrade && !debugMode) {
    return null;
  }

  // Responsive classes
  const responsiveClasses = cn(
    'paywall-container',
    {
      // Base variant styles
      'fixed inset-0 z-50 flex items-center justify-center p-4': effectiveVariant === 'modal',
      'relative w-full': effectiveVariant === 'inline',
      'fixed top-0 left-0 right-0 z-40': effectiveVariant === 'banner',
      'fixed right-0 top-0 bottom-0 w-80 z-40': effectiveVariant === 'sidebar',
      'relative inline-block': effectiveVariant === 'tooltip',
      
      // Animation classes
      'animate-fade-in': isVisibleState && enterAnimation === 'fade',
      'animate-slide-in': isVisibleState && enterAnimation === 'slide-up',
      
      // Responsive adjustments
      'md:w-96': effectiveVariant === 'sidebar',
      'md:p-6': effectiveVariant === 'modal',
    },
    containerClassName
  );

  const contentClasses = cn(
    'paywall-content relative bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700',
    {
      'max-w-2xl w-full': effectiveVariant === 'modal',
      'w-full': effectiveVariant === 'inline',
      'w-full': effectiveVariant === 'banner',
      'w-full h-full': effectiveVariant === 'sidebar',
      'max-w-sm': effectiveVariant === 'tooltip',
    },
    contentClassName
  );

  const headerClasses = cn(
    'paywall-header p-6 border-b border-gray-200 dark:border-gray-700',
    headerClassName
  );

  const footerClasses = cn(
    'paywall-footer p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3',
    footerClassName
  );

  const primaryActionClasses = cn(
    'btn btn-primary flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    primaryActionClassName
  );

  const secondaryActionClasses = cn(
    'btn btn-secondary flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium px-6 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
    secondaryActionClassName
  );

  // Render custom content if provided
  if (renderContent) {
    return (
      <div
        ref={containerRef}
        className={responsiveClasses}
        role={role}
        aria-modal={ariaModal}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
        onClick={effectiveVariant === 'modal' ? handleBackdropClick : undefined}
        data-testid={testId}
        id={id}
        {...htmlProps}
      >
        {renderContent({ 
          ...arguments[0], 
          isVisible: isVisibleState,
          loadingState: combinedLoadingState,
          errorState: combinedErrorState 
        } as PaywallProps)}
      </div>
    );
  }

  return (
    <>
      {/* Backdrop for modal variant */}
      {effectiveVariant === 'modal' && isVisibleState && (
        <div 
          className={cn(
            'fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40',
            backdropClassName
          )}
          onClick={closeOnBackdrop ? handleDismiss : undefined}
          aria-hidden="true"
        />
      )}

      {/* Main paywall container */}
      <div
        ref={containerRef}
        className={responsiveClasses}
        role={role}
        aria-modal={ariaModal}
        aria-labelledby={ariaLabelledBy || 'paywall-title'}
        aria-describedby={ariaDescribedBy || 'paywall-description'}
        tabIndex={tabIndex}
        onKeyDown={handleKeyDown}
        data-testid={testId}
        id={id}
        style={isVisibleState ? {} : { display: 'none' }}
        {...htmlProps}
      >
        <div className={contentClasses}>
          {/* Header */}
          {renderHeader ? renderHeader({ 
            ...arguments[0], 
            isVisible: isVisibleState,
            loadingState: combinedLoadingState,
            errorState: combinedErrorState 
          } as PaywallProps) : (
            <div className={headerClasses}>
              {effectiveVariant === 'modal' && (
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
                  aria-label={t(translationKeys.closeButtonKey)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              
              <div className="pr-8">
                <h1 
                  id="paywall-title"
                  className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                >
                  {content?.title || t(translationKeys.titleKey)}
                </h1>
                <p 
                  id="paywall-description"
                  className="text-gray-600 dark:text-gray-300"
                >
                  {content?.description || t(translationKeys.descriptionKey)}
                </p>
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className="p-6 space-y-6">
            {/* Error Display */}
            {combinedErrorState.hasError && (
              <div 
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-800 dark:text-red-200 font-medium">
                    {combinedErrorState.message || t(translationKeys.errorKey)}
                  </span>
                </div>
                {combinedErrorState.retryAction && (
                  <button
                    onClick={combinedErrorState.retryAction}
                    className="mt-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                  >
                    {t('paywall.retry')}
                  </button>
                )}
              </div>
            )}

            {/* Loading State */}
            {combinedLoadingState.isLoading && (
              <div 
                className="flex items-center justify-center p-8"
                role="status"
                aria-live="polite"
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">
                  {t(translationKeys.loadingKey)}
                </span>
              </div>
            )}

            {/* Feature Information - Desktop layout */}
            {!combinedLoadingState.isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Features List */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('paywall.featuresTitle')}
                  </h2>
                  <ul className="space-y-3">
                    {content?.features?.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium">
                            {feature.title}
                          </div>
                          {feature.description && (
                            <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                              {feature.description}
                            </div>
                          )}
                        </div>
                      </li>
                    )) || [
                      'paywall.feature1',
                      'paywall.feature2', 
                      'paywall.feature3'
                    ].map((key, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-900 dark:text-white">
                          {t(key)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Calendly Widget or Contact Information */}
                <div className="space-y-4">
                  {showCalendly && !combinedErrorState.calendlyError ? (
                    <>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('paywall.scheduleDemo')}
                      </h2>
                      <div 
                        ref={calendlyContainerRef}
                        className={cn('calendly-widget min-h-[400px] rounded-lg border border-gray-200 dark:border-gray-700', calendlyClassName)}
                        data-testid="calendly-widget"
                      />
                      {combinedLoadingState.calendlyLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('paywall.contactSales')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300">
                        {t('paywall.contactDescription')}
                      </p>
                      <div className="space-y-2">
                        <a 
                          href="mailto:sales@dreamfactory.com"
                          className="block text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                        >
                          sales@dreamfactory.com
                        </a>
                        <a 
                          href="tel:+1-650-350-8113"
                          className="block text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                        >
                          +1 (650) 350-8113
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pricing Information */}
            {content?.pricing && !combinedLoadingState.isLoading && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: content.pricing.currency,
                      ...content.pricing.formatOptions
                    }).format(content.pricing.amount)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    per {content.pricing.period}
                  </div>
                </div>
              </div>
            )}

            {/* Trial Information */}
            {content?.trial && !combinedLoadingState.isLoading && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('paywall.trialAvailable')}
                </h3>
                <p className="text-blue-800 dark:text-blue-200">
                  {content.trial.description || t('paywall.trialDescription', { days: content.trial.duration })}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {renderFooter ? renderFooter({ 
            ...arguments[0], 
            isVisible: isVisibleState,
            loadingState: combinedLoadingState,
            errorState: combinedErrorState 
          } as PaywallProps) : renderActions ? renderActions({ 
            ...arguments[0], 
            isVisible: isVisibleState,
            loadingState: combinedLoadingState,
            errorState: combinedErrorState 
          } as PaywallProps) : (
            <div className={footerClasses}>
              <button
                ref={primaryActionRef}
                onClick={handleUpgradeClick}
                disabled={combinedLoadingState.isLoading}
                className={primaryActionClasses}
                data-testid="paywall-upgrade-button"
              >
                {t(translationKeys.primaryActionKey)}
              </button>
              
              <button
                onClick={() => handleSecondaryAction('schedule_meeting')}
                disabled={combinedLoadingState.isLoading}
                className={secondaryActionClasses}
                data-testid="paywall-secondary-button"
              >
                {t(translationKeys.secondaryActionKey)}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

// Display name for debugging
Paywall.displayName = 'Paywall';

// Default export
export default Paywall;

// Type augmentation for Calendly window object
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement;
        [key: string]: any;
      }) => void;
    };
  }
}