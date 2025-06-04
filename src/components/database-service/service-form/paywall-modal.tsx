'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

/**
 * Configuration interface for Calendly widget initialization
 */
interface CalendlyConfig {
  url: string;
  parentElement: HTMLElement;
  autoLoad?: boolean;
  prefill?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}

/**
 * Props interface for the PaywallModal component
 */
interface PaywallModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
  /** Optional additional CSS classes */
  className?: string;
  /** Optional title override for the modal */
  title?: string;
  /** Whether to show contact information */
  showContact?: boolean;
}

/**
 * Paywall modal component for database service premium feature access.
 * 
 * This component displays a modal that prompts users to upgrade to premium features
 * and includes an embedded Calendly widget for scheduling a demo. It replaces the
 * Angular DfPaywallModal component with React 19 patterns.
 * 
 * Features:
 * - Accessible modal implementation using Headless UI Dialog
 * - Embedded Calendly widget for scheduling premium feature demos
 * - Responsive design with mobile-first approach
 * - WCAG 2.1 AA accessibility compliance
 * - Internationalization support with react-i18next
 * 
 * @param props - Component props
 * @returns React functional component
 */
export function PaywallModal({
  isOpen,
  onClose,
  className = '',
  title,
  showContact = true,
}: PaywallModalProps) {
  const calendlyWidgetRef = useRef<HTMLDivElement>(null);
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);
  const [calendlyError, setCalendlyError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Initialize Calendly widget when component mounts and modal opens
   */
  const initializeCalendly = useCallback(() => {
    if (!calendlyWidgetRef.current || !isOpen) {
      return;
    }

    try {
      // Check if Calendly script is already loaded
      if (typeof window !== 'undefined' && (window as any).Calendly) {
        const config: CalendlyConfig = {
          url: 'https://calendly.com/dreamfactory-platform/unlock-all-features',
          parentElement: calendlyWidgetRef.current,
          autoLoad: true,
        };

        // Add user prefill data if available
        if (user?.email || user?.firstName || user?.lastName) {
          config.prefill = {
            email: user.email || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          };
        }

        // Add UTM parameters for tracking
        config.utm = {
          utmSource: 'dreamfactory-admin',
          utmMedium: 'paywall-modal',
          utmCampaign: 'premium-features',
          utmContent: 'database-service-paywall',
        };

        (window as any).Calendly.initInlineWidget(config);
        setIsCalendlyLoaded(true);
        setCalendlyError(null);
      } else {
        throw new Error('Calendly script not loaded');
      }
    } catch (error) {
      console.error('Failed to initialize Calendly widget:', error);
      setCalendlyError('Failed to load scheduling widget. Please try again later.');
      setIsCalendlyLoaded(false);
    }
  }, [isOpen, user]);

  /**
   * Load Calendly script dynamically
   */
  useEffect(() => {
    if (!isOpen) return;

    const loadCalendlyScript = () => {
      // Check if script is already loaded
      if (typeof window !== 'undefined' && (window as any).Calendly) {
        initializeCalendly();
        return;
      }

      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="calendly.com"]');
      if (existingScript) {
        // Script exists but might not be loaded yet
        existingScript.addEventListener('load', initializeCalendly);
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = initializeCalendly;
      script.onerror = () => {
        setCalendlyError('Failed to load Calendly script. Please check your internet connection.');
        setIsCalendlyLoaded(false);
      };

      document.head.appendChild(script);
    };

    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(loadCalendlyScript, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, initializeCalendly]);

  /**
   * Handle modal close with cleanup
   */
  const handleClose = useCallback(() => {
    // Reset Calendly state when closing
    setIsCalendlyLoaded(false);
    setCalendlyError(null);
    onClose();
  }, [onClose]);

  /**
   * Handle escape key press
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, handleClose]);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={handleClose}
        aria-labelledby="paywall-modal-title"
        aria-describedby="paywall-modal-description"
      >
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`
                  relative w-full max-w-6xl transform overflow-hidden rounded-2xl 
                  bg-white text-left align-middle shadow-xl transition-all
                  dark:bg-gray-900 ${className}
                `}
              >
                {/* Close button */}
                <div className="absolute right-4 top-4 z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>

                {/* Modal content */}
                <div className="p-6 pb-8 sm:p-8">
                  {/* Header section */}
                  <div className="mb-8 text-center">
                    <Dialog.Title
                      as="h2"
                      id="paywall-modal-title"
                      className="text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl"
                    >
                      {title || 'Unlock Premium Features'}
                    </Dialog.Title>
                    
                    <Dialog.Description
                      as="h3"
                      id="paywall-modal-description"
                      className="mt-3 text-xl text-gray-600 dark:text-gray-300 sm:text-2xl"
                    >
                      Take your API development to the next level
                    </Dialog.Description>
                  </div>

                  {/* Info columns section */}
                  <div className="mx-auto mb-8 max-w-4xl">
                    <div className="grid gap-8 md:grid-cols-2">
                      {/* Hosted trial column */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                          Free Hosted Trial Available
                        </h4>
                        <div className="prose prose-gray dark:prose-invert">
                          <p>
                            Book a time with our team to explore DreamFactory's powerful features 
                            in a live demonstration. We'll show you how to:
                          </p>
                          <ul className="mt-3 space-y-2 text-sm">
                            <li>Generate REST APIs from any database in minutes</li>
                            <li>Implement enterprise-grade security controls</li>
                            <li>Scale to handle millions of API requests</li>
                            <li>Integrate with existing authentication systems</li>
                          </ul>
                        </div>
                      </div>

                      {/* Learn more column */}
                      <div className="space-y-4">
                        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                          What You'll Gain
                        </h4>
                        <div className="prose prose-gray dark:prose-invert">
                          <p>
                            Unlock the full potential of DreamFactory with premium features 
                            designed for enterprise deployment:
                          </p>
                          <ul className="mt-3 space-y-2 text-sm">
                            <li>Advanced API security and rate limiting</li>
                            <li>Custom scripting and business logic</li>
                            <li>Multi-environment deployment support</li>
                            <li>Priority technical support and training</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="mb-6 text-center">
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Ready to speak with a human?
                    </h3>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      Schedule a personalized demo with our product experts
                    </p>
                  </div>

                  {/* Calendly widget container */}
                  <div className="relative">
                    {calendlyError ? (
                      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <div className="text-center">
                          <p className="mb-4 text-red-600 dark:text-red-400">
                            {calendlyError}
                          </p>
                          <Button
                            onClick={() => {
                              setCalendlyError(null);
                              initializeCalendly();
                            }}
                            variant="outline"
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Loading state */}
                        {!isCalendlyLoaded && (
                          <div className="flex min-h-[600px] items-center justify-center">
                            <div className="text-center">
                              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
                              <p className="text-gray-600 dark:text-gray-300">
                                Loading scheduling widget...
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Calendly widget */}
                        <div
                          ref={calendlyWidgetRef}
                          className={`
                            calendly-inline-widget transition-opacity duration-500
                            ${isCalendlyLoaded ? 'opacity-100' : 'opacity-0'}
                          `}
                          style={{
                            minWidth: '320px',
                            width: '100%',
                            height: '700px',
                          }}
                          data-auto-load="false"
                        />
                      </>
                    )}
                  </div>

                  {/* Contact information */}
                  {showContact && (
                    <div className="mt-8 border-t border-gray-200 pt-6 text-center dark:border-gray-700">
                      <h4 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                        Prefer to contact us directly?
                      </h4>
                      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
                        <a
                          href="tel:+14159935877"
                          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          aria-label="Call DreamFactory at +1 415-993-5877"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Phone: +1 415-993-5877
                        </a>
                        
                        <span className="hidden text-gray-400 sm:inline">|</span>
                        
                        <a
                          href="mailto:info@dreamfactory.com"
                          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                          aria-label="Email DreamFactory at info@dreamfactory.com"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                          </svg>
                          Email: info@dreamfactory.com
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Export the component as default
export default PaywallModal;

// Export types for external use
export type { PaywallModalProps, CalendlyConfig };